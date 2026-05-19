"""Embedding provider abstraction for mellō retrieval.

The embedding layer is deliberately swappable. Phase 0–1 prefers Voyage:
retrieval quality here is part of the emotional architecture, not infra
trivia. A weak retrieval in mellō does not read as "less accurate" — it
reads as false, intrusive, or manipulative, which damages trust.

Provider selection:
    MELLO_EMBEDDING_PROVIDER=voyage   force Voyage (hard-fail if unavailable)
    MELLO_EMBEDDING_PROVIDER=local    force local nomic via Ollama
    (unset / default)                  try Voyage, fall back to local nomic

CRITICAL — dimensionality safety. Voyage voyage-3 is 1024-dim; nomic-embed-text
is 768-dim. Vectors of different dim are not comparable. A provider is chosen
ONCE per process and used for the whole seed+retrieve cycle. The Qdrant
collection name is scoped by provider+dim (see collection_name) so a
Voyage-seeded store can never be queried with nomic vectors by accident —
the worst case is "wrong collection is empty", never "silently wrong results".

Local (nomic) is a FALLBACK, not the validated path. When local is used,
quality-sensitive chill tests (#1 precision, #5 anti-haunting, #6 growth) are
PROVISIONAL until re-run on Voyage. Logic tests (#2 restraint, #3 diversity,
#4 sealed suppression) are valid on either provider.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Literal, Protocol, runtime_checkable

InputType = Literal["document", "query"]

VOYAGE_BATCH_CAP = 128  # Voyage caps a single embed call at 128 inputs.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
NOMIC_MODEL = os.environ.get("MELLO_LOCAL_EMBED_MODEL", "nomic-embed-text")


class EmbeddingUnavailable(RuntimeError):
    """A provider cannot initialize (missing key, Ollama down, model not
    pulled). The factory decides whether to fall back or hard-exit."""


@runtime_checkable
class EmbeddingProvider(Protocol):
    slug: str
    dim: int

    def embed(self, texts: list[str], input_type: InputType) -> list[list[float]]:
        ...


class VoyageEmbeddingProvider:
    slug = "voyage"

    def __init__(self, model: str | None = None) -> None:
        try:
            import voyageai
        except ImportError as e:
            raise EmbeddingUnavailable("voyageai SDK not installed") from e
        if not os.environ.get("VOYAGE_API_KEY"):
            raise EmbeddingUnavailable("VOYAGE_API_KEY not set")
        self.model = model or os.environ.get("VOYAGE_MODEL", "voyage-3")
        self.dim = int(os.environ.get("VOYAGE_EMBED_DIM", "1024"))
        self._client = voyageai.Client()

    def embed(self, texts: list[str], input_type: InputType) -> list[list[float]]:
        out: list[list[float]] = []
        for i in range(0, len(texts), VOYAGE_BATCH_CAP):
            chunk = texts[i : i + VOYAGE_BATCH_CAP]
            result = self._client.embed(chunk, model=self.model, input_type=input_type)
            out.extend(result.embeddings)
        return out


class LocalEmbeddingProvider:
    """nomic-embed-text via local Ollama. No key, no external API.

    nomic is asymmetric: it expects 'search_document:' / 'search_query:'
    task prefixes. Without them retrieval quality drops materially, so they
    are applied here, mapped from InputType.
    """

    slug = "local"

    def __init__(self, model: str | None = None) -> None:
        self.model = model or NOMIC_MODEL
        try:
            with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=5) as r:
                tags = json.loads(r.read())
        except (urllib.error.URLError, OSError) as e:
            raise EmbeddingUnavailable(f"Ollama not reachable at {OLLAMA_URL}") from e
        pulled = {m.get("name", "").split(":")[0] for m in tags.get("models", [])}
        if self.model.split(":")[0] not in pulled:
            raise EmbeddingUnavailable(
                f"Ollama model {self.model!r} not pulled (run: ollama pull {self.model})"
            )
        # One probe call establishes the true dimensionality.
        self.dim = len(self._embed_one("search_document: dimensionality probe"))

    def _embed_one(self, text: str) -> list[float]:
        body = json.dumps({"model": self.model, "prompt": text}).encode("utf-8")
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/embeddings",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                payload = json.loads(r.read())
        except (urllib.error.URLError, OSError) as e:
            raise EmbeddingUnavailable(f"Ollama embed call failed: {e}") from e
        vec = payload.get("embedding")
        if not vec:
            raise EmbeddingUnavailable(f"Ollama returned no embedding: {str(payload)[:200]}")
        return vec

    def embed(self, texts: list[str], input_type: InputType) -> list[list[float]]:
        prefix = "search_document: " if input_type == "document" else "search_query: "
        return [self._embed_one(prefix + t) for t in texts]


def get_embedding_provider() -> EmbeddingProvider:
    """Voyage primary, nomic-local fallback. Explicit selection hard-fails
    if the named provider is unavailable (no silent substitution)."""
    explicit = os.environ.get("MELLO_EMBEDDING_PROVIDER", "").strip().lower()

    if explicit == "voyage":
        try:
            p = VoyageEmbeddingProvider()
            print("[embeddings] Voyage (voyage-3) — explicitly selected.", file=sys.stderr)
            return p
        except EmbeddingUnavailable as e:
            sys.exit(f"Voyage explicitly selected but unavailable: {e}")

    if explicit == "local":
        try:
            p = LocalEmbeddingProvider()
            print(
                f"[embeddings] local {p.model} ({p.dim}-dim) — explicitly selected. "
                "Quality-sensitive chill tests are PROVISIONAL.",
                file=sys.stderr,
            )
            return p
        except EmbeddingUnavailable as e:
            sys.exit(f"Local embedding explicitly selected but unavailable: {e}")

    # Default: prefer Voyage, fall back to local nomic.
    try:
        p = VoyageEmbeddingProvider()
        print("[embeddings] Voyage (voyage-3) — primary.", file=sys.stderr)
        return p
    except EmbeddingUnavailable as ve:
        print(
            f"[embeddings] Voyage unavailable ({ve}). Falling back to local nomic via Ollama.",
            file=sys.stderr,
        )
        try:
            p = LocalEmbeddingProvider()
            print(
                f"[embeddings] local {p.model} ({p.dim}-dim) — FALLBACK. "
                "Quality-sensitive chill tests (#1/#5/#6) are PROVISIONAL until re-run on Voyage.",
                file=sys.stderr,
            )
            return p
        except EmbeddingUnavailable as le:
            sys.exit(f"No embedding provider available. Voyage: {ve}. Local: {le}.")


def collection_name(base: str, provider: EmbeddingProvider) -> str:
    """Provider+dim-scoped collection. Prevents cross-dimensional contamination:
    a Voyage(1024)-seeded store and a local(768) store are different
    collections, so a mismatched query finds an empty collection rather than
    erroring mid-test or returning silently-wrong results."""
    return f"{base}__{provider.slug}_{provider.dim}"

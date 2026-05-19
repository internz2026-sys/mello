"""mellō — Memory Seeder (Phase 0 prototype)

Reads a JSON file of distilled memories (output of distiller/distiller.py),
embeds each memory's `summary` via the swappable embedding provider, and
upserts to a Qdrant collection. Payload carries every field on the Memory
dataclass so the retriever can filter/rank without a second store.

The embedding provider is selected by embeddings.get_embedding_provider()
(Voyage primary, nomic-local fallback). The collection is provider+dim
scoped so a Voyage-seeded store is never queried with local vectors.

This is a CLI prototype. One user at a time. No incremental sync —
re-running re-upserts.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

from embeddings import EmbeddingProvider, collection_name, get_embedding_provider

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models as qmodels
except ImportError:
    sys.exit("qdrant-client missing. Run: pip install -r requirements.txt")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
COLLECTION_BASE = os.environ.get("QDRANT_COLLECTION", "mello_memories")


# Fields we expect on every distilled memory. Missing ones get safe defaults
# so the retriever's ranker doesn't trip on legacy / partial records.
MEMORY_FIELDS: dict[str, Any] = {
    "kind": "",
    "stability": "evolving",
    "sensitivity": "normal",
    "summary": "",
    "evidence": [],
    "emotions": [],
    "themes": [],
    "relationships": [],
    "spiritual_themes": [],
    "importance": 0.5,
    "identity_weight": 0.5,
    "first_observed_at": "",
    "last_reinforced_at": "",
}


def stable_point_id(user_id: str, summary: str) -> str:
    """Deterministic UUID5 so re-seeding the same memory replaces, not duplicates."""
    seed = f"{user_id}::{summary}".encode("utf-8")
    digest = hashlib.sha1(seed).hexdigest()
    return str(uuid.UUID(digest[:32]))


def ensure_collection(client: QdrantClient, coll: str, dim: int) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if coll in existing:
        return
    client.create_collection(
        collection_name=coll,
        vectors_config=qmodels.VectorParams(
            size=dim,
            distance=qmodels.Distance.COSINE,
        ),
    )
    for field, schema in [
        ("user_id", qmodels.PayloadSchemaType.KEYWORD),
        ("sensitivity", qmodels.PayloadSchemaType.KEYWORD),
        ("themes", qmodels.PayloadSchemaType.KEYWORD),
        ("kind", qmodels.PayloadSchemaType.KEYWORD),
    ]:
        client.create_payload_index(
            collection_name=coll,
            field_name=field,
            field_schema=schema,
        )
    print(f"[seeder] created collection {coll!r} ({dim}-dim, cosine)", file=sys.stderr)


def normalize_memory(raw: dict) -> dict:
    out: dict[str, Any] = {}
    for key, default in MEMORY_FIELDS.items():
        val = raw.get(key, default)
        if val is None:
            val = default
        out[key] = val
    return out


def main() -> None:
    p = argparse.ArgumentParser(description="mellō memory seeder → Qdrant")
    p.add_argument("--in", dest="in_path", required=True, help="JSON file of distilled memories")
    p.add_argument(
        "--user_id",
        default="test_user",
        help="Owner user_id stamped on every payload (default: test_user)",
    )
    p.add_argument(
        "--recreate",
        action="store_true",
        help="Drop and recreate the collection before seeding",
    )
    args = p.parse_args()

    in_path = Path(args.in_path)
    if not in_path.exists():
        sys.exit(f"input not found: {in_path}")

    memories_raw = json.loads(in_path.read_text(encoding="utf-8"))
    if not isinstance(memories_raw, list):
        sys.exit("expected a JSON list of memory objects")

    memories = [normalize_memory(m) for m in memories_raw if m.get("summary")]
    if not memories:
        print("[seeder] no memories with summaries — nothing to embed.", file=sys.stderr)
        return

    # Provider chosen once; its dim sizes the (provider-scoped) collection.
    provider: EmbeddingProvider = get_embedding_provider()
    coll = collection_name(COLLECTION_BASE, provider)

    client = QdrantClient(url=QDRANT_URL)
    if args.recreate:
        try:
            client.delete_collection(collection_name=coll)
            print(f"[seeder] dropped existing {coll!r}", file=sys.stderr)
        except Exception:
            pass
    ensure_collection(client, coll, provider.dim)

    summaries = [m["summary"] for m in memories]
    print(f"[seeder] embedding {len(summaries)} summaries...", file=sys.stderr)
    vectors = provider.embed(summaries, "document")

    points: list[qmodels.PointStruct] = []
    for mem, vec in zip(memories, vectors):
        payload = dict(mem)
        payload["user_id"] = args.user_id
        points.append(
            qmodels.PointStruct(
                id=stable_point_id(args.user_id, mem["summary"]),
                vector=vec,
                payload=payload,
            )
        )

    client.upsert(collection_name=coll, points=points, wait=True)
    print(
        f"[done] upserted {len(points)} memories for user_id={args.user_id!r} "
        f"into {coll!r} @ {QDRANT_URL}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()

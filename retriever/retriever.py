"""mellō — Memory Retriever (Phase 0 prototype)

Given a user_id and a natural-language query, fetches the top 6-8
distilled memories from Qdrant. Ranks with:

    score = 0.5 * cosine_similarity
          + 0.3 * importance
          + 0.2 * recency_signal

Then a diversity pass:
  - Drop near-duplicates (cosine > 0.9 to a higher-scored sibling)
  - Cap each `theme` at 2 results
  - Final cut: top FINAL_K

Sensitivity rules from voice/memory-taxonomy.md are enforced here, not
upstream. `sealed` is excluded by default. `tender` is allowed but the
caller (chat / letter prompt) is expected to decide whether to use it.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from datetime import datetime, timezone
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

# Relevance gate. Invariant: retrieval relevance outranks historical
# importance. A memory below the floor is never resurfaced, regardless of
# how important or recent it is — a person is not their deepest wound every
# morning. Applied BEFORE composite scoring. Env-tunable; 0.30 separates
# genuine matches (observed >0.42) from haunting noise (observed <0.19).
# Provisional pending a larger corpus; per-kind floors deliberately deferred.
SIMILARITY_FLOOR = float(os.environ.get("SIMILARITY_FLOOR", "0.30"))

# Ranking weights — mirror voice/memory-taxonomy.md.
W_SIM = 0.5
W_IMP = 0.3
W_REC = 0.2

# Diversity pass.
NEAR_DUP_THRESHOLD = 0.9
MAX_PER_THEME = 2
FINAL_K = 8        # cap on what we return
CANDIDATE_K = 30   # pull a wider net before re-ranking


def recency_signal(last_reinforced_at: str, now: datetime | None = None) -> float:
    """1 / (1 + days_since/30). Missing/invalid timestamp → 0.0 (no boost)."""
    if not last_reinforced_at:
        return 0.0
    try:
        ts = datetime.fromisoformat(last_reinforced_at.replace("Z", "+00:00"))
    except ValueError:
        return 0.0
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    now = now or datetime.now(timezone.utc)
    days = max(0.0, (now - ts).total_seconds() / 86400.0)
    return 1.0 / (1.0 + days / 30.0)


def cosine(u: list[float], v: list[float]) -> float:
    dot = sum(a * b for a, b in zip(u, v))
    nu = math.sqrt(sum(a * a for a in u))
    nv = math.sqrt(sum(b * b for b in v))
    if nu == 0 or nv == 0:
        return 0.0
    return dot / (nu * nv)


def composite_score(sim: float, importance: float, recency: float) -> float:
    return W_SIM * sim + W_IMP * importance + W_REC * recency


def diversity_filter(ranked: list[dict], final_k: int = FINAL_K) -> list[dict]:
    """
    `ranked` is sorted desc by composite score and carries `vector` per entry.
    Drops near-duplicates and caps each theme at MAX_PER_THEME.
    """
    kept: list[dict] = []
    theme_counts: dict[str, int] = {}

    for cand in ranked:
        if len(kept) >= final_k:
            break

        # Near-duplicate check against everything already kept (which all scored higher).
        is_dup = False
        for k in kept:
            if cosine(cand["vector"], k["vector"]) > NEAR_DUP_THRESHOLD:
                is_dup = True
                break
        if is_dup:
            continue

        # Theme cap. A memory with multiple themes is dropped only if EVERY
        # one of its themes is already at the cap — otherwise we keep it and
        # bump the counters. This keeps multi-themed memories addressable
        # without letting one dominant theme flood the result set.
        themes = cand["payload"].get("themes") or []
        if themes:
            available = [t for t in themes if theme_counts.get(t, 0) < MAX_PER_THEME]
            if not available:
                continue
            for t in themes:
                theme_counts[t] = theme_counts.get(t, 0) + 1

        kept.append(cand)

    return kept


def build_filter(user_id: str, include_sealed: bool) -> qmodels.Filter:
    must: list[qmodels.FieldCondition] = [
        qmodels.FieldCondition(
            key="user_id",
            match=qmodels.MatchValue(value=user_id),
        )
    ]
    must_not: list[qmodels.FieldCondition] = []
    if not include_sealed:
        must_not.append(
            qmodels.FieldCondition(
                key="sensitivity",
                match=qmodels.MatchValue(value="sealed"),
            )
        )
    return qmodels.Filter(must=must, must_not=must_not or None)


def retrieve(
    client: QdrantClient,
    provider: EmbeddingProvider,
    user_id: str,
    query: str,
    include_sealed: bool,
    final_k: int,
) -> list[dict]:
    qvec = provider.embed([query], "query")[0]
    coll = collection_name(COLLECTION_BASE, provider)

    # qdrant-client >=1.10 replaced .search() with .query_points();
    # response carries the scored points on .points
    hits = client.query_points(
        collection_name=coll,
        query=qvec,
        query_filter=build_filter(user_id, include_sealed),
        limit=CANDIDATE_K,
        with_payload=True,
        with_vectors=True,
    ).points

    scored: list[dict] = []
    for h in hits:
        payload = h.payload or {}
        sim = float(h.score or 0.0)  # Qdrant returns cosine similarity for COSINE distance
        # Relevance gate — before any weighting. Importance cannot rescue an
        # emotionally irrelevant memory into the result set.
        if sim < SIMILARITY_FLOOR:
            continue
        importance = float(payload.get("importance") or 0.0)
        recency = recency_signal(payload.get("last_reinforced_at", ""))
        scored.append(
            {
                "id": str(h.id),
                "score": composite_score(sim, importance, recency),
                "components": {
                    "similarity": round(sim, 4),
                    "importance": round(importance, 4),
                    "recency": round(recency, 4),
                },
                "payload": payload,
                "vector": list(h.vector) if h.vector else [],
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    kept = diversity_filter(scored, final_k=final_k)

    # Strip the vector before returning — it's only needed for diversity comparisons.
    for k in kept:
        k.pop("vector", None)
    return kept


def main() -> None:
    p = argparse.ArgumentParser(description="mellō memory retriever")
    p.add_argument("--user_id", required=True, help="user_id whose memories to search")
    p.add_argument("--query", required=True, help="natural-language query")
    p.add_argument(
        "--include-sealed",
        action="store_true",
        help="Include sensitivity=sealed memories (default: excluded)",
    )
    p.add_argument(
        "--k",
        type=int,
        default=FINAL_K,
        help=f"Final number of memories to return (default: {FINAL_K})",
    )
    p.add_argument(
        "--format",
        choices=["json", "pretty"],
        default="pretty",
        help="Output format (default: pretty)",
    )
    args = p.parse_args()

    client = QdrantClient(url=QDRANT_URL)
    provider = get_embedding_provider()

    results = retrieve(
        client=client,
        provider=provider,
        user_id=args.user_id,
        query=args.query,
        include_sealed=args.include_sealed,
        final_k=max(1, min(args.k, FINAL_K)),
    )

    if args.format == "json":
        print(json.dumps(results, indent=2, ensure_ascii=False))
        return

    if not results:
        print(f"[retriever] no memories matched for user_id={args.user_id!r}.")
        print("[retriever] trust silence — or check that the seeder ran.")
        return

    print(f"\n— Top {len(results)} memories for {args.user_id!r} —")
    print(f"  query: {args.query!r}")
    print(f"  sealed: {'included' if args.include_sealed else 'excluded'}\n")
    for i, r in enumerate(results, 1):
        pl = r["payload"]
        c = r["components"]
        print(f"[{i}] {pl.get('kind','?')}/{pl.get('stability','?')}/{pl.get('sensitivity','?')}")
        print(f"    summary: {pl.get('summary','')}")
        themes = ", ".join(pl.get("themes") or []) or "—"
        rels = ", ".join(pl.get("relationships") or []) or "—"
        print(f"    themes: {themes}    relationships: {rels}")
        print(
            f"    score: {r['score']:.4f}   "
            f"(sim={c['similarity']:.3f}, imp={c['importance']:.3f}, rec={c['recency']:.3f})"
        )
        print()


if __name__ == "__main__":
    main()

# Retriever — mellō's memory recall prototype

Pairs with `../distiller/`. The distiller writes distilled memories to JSON;
the seeder embeds them and pushes to Qdrant; the retriever pulls the top
6-8 most relevant for a given query, respecting sensitivity rules.

No LangChain. Just `qdrant-client` and `voyageai` directly — the surface
area is small enough that an indirection layer would obscure more than it
saves.

## Why this matters

Retrieval is where the distillation's quality either pays off or evaporates.
If the ranker collapses on a dominant theme (every result about "dad,
fear"), the chat layer above it will feel monotone — like a friend who only
brings up your worst pattern. The diversity pass is non-optional.

## Setup

```bash
cd retriever
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add VOYAGE_API_KEY (and ANTHROPIC_API_KEY if you'll use it downstream)
```

## End-to-end local flow

From the repo root:

```bash
# 1. Boot Qdrant (persists to a named Docker volume)
cd retriever
docker compose up -d qdrant

# 2. Distill the sample journal entries into semantic memories
cd ../distiller
python distiller.py --in fixtures/sample_entries.json --out output/memories.json

# 3. Seed Qdrant with those memories (user_id defaults to "test_user")
cd ../retriever
python seeder.py --in ../distiller/output/memories.json --user_id test_user

# 4. Query
python retriever.py --user_id test_user --query "I'm afraid of disappointing my dad"
```

## CLI reference

### `seeder.py`

```
python seeder.py --in <path/to/memories.json> [--user_id test_user] [--recreate]
```

- Reads the distiller's JSON list.
- Embeds each memory's `summary` with Voyage `voyage-3` (1024-dim).
- Upserts to Qdrant collection `mello_memories` with COSINE distance.
- Point IDs are deterministic UUID5 of `(user_id, summary)` so re-runs
  update in place instead of duplicating.
- `--recreate` drops and recreates the collection. Use after schema changes.

Payload carries every Memory field the distiller produced — `kind`,
`stability`, `sensitivity`, `themes`, `emotions`, `relationships`,
`spiritual_themes`, `importance`, `identity_weight`, `first_observed_at`,
`last_reinforced_at`, `evidence` — plus `user_id`.

### `retriever.py`

```
python retriever.py --user_id <id> --query "<question>" [--include-sealed] [--k 8] [--format pretty|json]
```

Ranking (per `voice/memory-taxonomy.md`):

```
score = 0.5 * cosine_similarity
      + 0.3 * importance
      + 0.2 * recency_signal

recency_signal = 1 / (1 + days_since_last_reinforced / 30)
```

Diversity pass:

- Drop near-duplicates (cosine > 0.9 to a higher-scored sibling already kept).
- Cap any single `theme` at 2 results. A multi-themed memory is allowed if
  at least one of its themes is still under the cap.
- Final cut: top 6-8 (configurable via `--k`, max 8).

Sensitivity:

- `sealed` is excluded by default. Pass `--include-sealed` only when the
  user has explicitly invoked sealed content (e.g., a deep reflection
  ritual). Surfacing sealed proactively is a product failure.
- `tender` is returned; the caller is responsible for deciding whether
  to use it (e.g., never in a daily notification).

## Configuration

| Env var | Default | Notes |
|---|---|---|
| `VOYAGE_API_KEY` | — | required |
| `ANTHROPIC_API_KEY` | — | unused by v0.1 retrieval, kept for downstream rerank/synthesis |
| `QDRANT_URL` | `http://localhost:6333` | |
| `QDRANT_COLLECTION` | `mello_memories` | |
| `VOYAGE_MODEL` | `voyage-3` | embedding dim is hardcoded to 1024 |

## What this doesn't do (yet)

- No per-user collection isolation — single collection, filtered by `user_id`
  payload. Fine for prototype; production should consider one collection
  per tenant or namespace partitioning.
- No reranker on top of cosine. Voyage's `rerank-2.5` is the obvious next step
  for high-stakes recall (letters, future-self conversations).
- No decay curve applied at scoring time beyond `recency_signal`. The
  `stability` axis in the taxonomy (stable / evolving / volatile) is in
  payload but not yet weighted into the score.
- No safety filter beyond sensitivity. Crisis classification is a separate pipeline.
- No batch reindex tool. Re-seeding the same input is idempotent (stable IDs)
  but there's no orphan cleanup for memories the distiller has since deleted.

## File layout

```
retriever/
├── docker-compose.yml   Qdrant on :6333 with persistent volume
├── seeder.py            JSON memories → Voyage embed → Qdrant upsert
├── retriever.py         query → embed → search → re-rank → diversity → top N
├── requirements.txt
├── .env.example
└── README.md
```

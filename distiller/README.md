# Distiller — mellō's memory engine prototype

The hardest, most important part of mellō. This is a CLI-only prototype.
No database. No retrieval yet. Just: feed it journal entries, watch what
becomes long-term memory.

## Why this matters

A semantic memory is the difference between:

> "User said they had coffee."

and

> "User often feels emotionally disconnected during periods of overwork and isolation."

The first is noise. The second is the entire product.

If reading the output of this script gives you a chill — "this is exactly
what I was working through" — the architecture is right. If it produces
generic summaries, the prompts or model choice is wrong. Tune until it
feels alive.

## Setup

```bash
cd distiller
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your Anthropic API key
```

## Run

```bash
python distiller.py \
  --in fixtures/sample_entries.json \
  --out output/memories.json
```

Add `--existing output/memories.json` on subsequent runs so the distiller
can decide whether to reinforce vs. create new.

## What you should see

Given the 6 sample entries, the distiller should produce roughly 3–5 memories
about:

- Recurring fear of disappointing the user's father, especially around career
- Pattern of avoiding hard emotions by buying or freezing
- The relationship with Sarah as a source of honesty and rest
- A value around presence with the people who matter
- Possibly: an early hint of spiritual return (only if the test user is opted-in)

It should NOT produce memories about:

- The grocery run
- Sleeping badly on a specific Tuesday
- Buying a specific book

If it produces memories about specific events that aren't pattern-revealing,
the distiller prompt is too eager. Tighten it.

## Tuning

- Edit prompts in [distiller.py](distiller.py) — `NOTICER_SYSTEM` and `DISTILLER_SYSTEM`.
- The Distiller pass uses Opus by default (harder judgment call). The Noticer uses Sonnet (cost-sensitive extraction).
- Override via env vars: `MELLO_NOTICER_MODEL`, `MELLO_DISTILLER_MODEL`.
- The single most important tuning lever: making the Distiller more conservative. Most days should produce zero memories.

## What this doesn't do (yet)

- No Qdrant. No embeddings. No retrieval. → see `retriever/`
- No reconciliation logic (new memories are appended, not merged by ID)
- No decay function
- No safety/crisis classification (separate pipeline)
- No integration with Postgres / Supabase
- No async batch over many users

Phase 1 will wire this into a real pipeline. For now: prove the distillation
works on a single user's worth of text.

## File layout

```
distiller/
├── distiller.py            The pipeline
├── requirements.txt
├── .env.example
├── fixtures/
│   └── sample_entries.json Test journal entries
└── output/                 gitignored — generated memories
```

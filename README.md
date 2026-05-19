# mellō

> *A quieter place to think.*
>
> *For the long arc of who you were made to be.*

An emotionally intelligent AI companion for reflection, future-self conversations, and intentional living.
Not a productivity app. Not a chatbot. A reflective memory system with a voice.

## Phase 0 — Soul first

This repository is in **Phase 0**: writing the voice and prototyping the memory engine
**before** any UI or app scaffolding. The discipline is deliberate — if the voice
isn't right in plaintext, no design system can save it.

## Layout

```
mello/
├── voice/                    The prose that defines who mellō is
│   ├── character-bible.md    How mellō speaks (loaded into every AI call)
│   ├── onboarding-script.md  The 7 rooms of first contact
│   └── memory-taxonomy.md    Controlled vocabularies for the memory engine
│
├── distiller/                Python prototype of the memory pipeline
│   ├── distiller.py          Two-pass Claude pipeline (Noticer + Distiller)
│   ├── fixtures/             Sample journal entries to feed it
│   └── README.md
│
├── retriever/                Phase 1 — Qdrant + Voyage retrieval (agent in flight)
├── api/                      Phase 1 — NestJS scaffold (agent in flight)
├── backend/migrations/       Phase 1 — Postgres schema (agent in flight)
├── apps/web/                 Phase 1 — Next.js scaffold (agent in flight)
├── apps/mobile/              Phase 1 — Expo scaffold (agent in flight)
├── e2e/                      Phase 1 — Playwright (agent in flight)
├── audits/                   Voice & architecture audit reports
│
└── .claude/                  Project-level Claude Code config (hooks)
```

## Stack (decided)

| Layer | Tech |
|---|---|
| Web | Next.js, TS, Tailwind, shadcn (heavily restyled), Framer Motion |
| Mobile | Expo (React Native) |
| Backend | NestJS, Docker, Hostinger VPS (MVP) |
| Data | Supabase (Postgres + auth + storage) |
| Memory | Qdrant (self-hosted) + Voyage AI embeddings |
| AI | Anthropic Claude — Sonnet daily, Opus for letters/distillation |

## Working principles

1. Memory ≠ history. The AI consults a distilled semantic memory of who the user is — not the raw chat log.
2. Tone is enforced architecturally, not just instructed. See [voice/character-bible.md](voice/character-bible.md).
3. Silence is a feature. mellō is willing to say nothing.
4. The spiritual layer is opt-in, subtle, and never coercive.
5. No streaks. No re-engagement spam. Max 1 notification/day.
6. The user owns their memory. Full export, full delete, cascade enforced.

## Getting started (Phase 0 only)

To run the distiller prototype:

```bash
cd distiller
pip install -r requirements.txt
cp .env.example .env  # add your Anthropic API key
python distiller.py --in fixtures/sample_entries.json --out output/memories.json
```

Read what comes out. If it produces memories that feel uncannily true about the test user,
the architecture works. If it produces generic summaries, the prompt or model is wrong —
tune until it feels alive.

# mellō — Project Instructions for Claude

This project is **mellō**, an emotionally intelligent AI companion app for
reflection, future-self identity formation, and intentional living.

## Phase 0 — Soul-first

We are deliberately NOT writing full app code yet. The work right now:

1. Lock the **voice** in `voice/`
2. Prototype the **memory engine** in `distiller/` and `retriever/`

Full UI scaffolding (Next.js, Expo, NestJS) is happening in `apps/` and `api/`
as parallel agent work, but the voice docs are the source of truth — when any
agent's output conflicts with `voice/character-bible.md`, the voice wins.

## Session greeting

The first response of every new session in this project must begin with the literal phrase:

> I am Mello agent.

A SessionStart hook in `.claude/settings.json` injects this reminder.

## Persistent knowledgebase

Two locations:

- **Project memory** (auto-loaded): `C:\Users\Admin\.claude\projects\c--Users-Admin\memory\project_mello.md`
- **Source of truth** (in-repo): `voice/`, `distiller/`, `README.md`

A SessionEnd hook drops `.mello-pending-memory-update`. A Stop hook with a 5-min
`asyncRewake` does the same if you go idle without closing. The next SessionStart
detects either marker and reviews recent work before proceeding.

When you update memory, prefer adding to `project_mello.md` for narrative context
about decisions, and to the in-repo files for product-source-of-truth content.

## Tone for working ON mellō

This is a meditation-grade product. Internal conventions reflect that:

- Don't suggest hustle-culture features (streaks, gamification, leaderboards).
- Default to fewer features, not more.
- When in doubt, choose silence as a feature.
- Spiritual content is opt-in and subtle. Never preachy.
- No exclamation points in product copy. Ever.

See `voice/character-bible.md` for the full voice specification.

## Working with the parallel agent fleet

Subdirectories assigned to specific agents:

| Path | Agent | Model |
|---|---|---|
| `backend/migrations/` | Backend-1 (Postgres schema) | Opus |
| `retriever/` | Backend-2 (Qdrant + Voyage prototype) | Opus |
| `api/` | Backend-3 (NestJS scaffold) | Opus |
| `apps/web/` | Frontend-1 (Next.js) | Sonnet |
| `apps/mobile/` | Frontend-2 (Expo) | Sonnet |
| `audits/voice-audit.md` | Auditor-1 (Voice review) | Opus |
| `audits/architecture-audit.md` | Auditor-2 (Architecture review) | Opus |
| `e2e/` | Playwright tester | Sonnet |

Do not modify another agent's directory without checking first. The voice docs
(`voice/`) and the distiller (`distiller/`) are the shared foundation —
all agents read these but only the human (or a follow-up explicit task) edits them.

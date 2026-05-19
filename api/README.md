# mellō — API (NestJS)

Phase 1 scaffold of the mellō backend. Thin controllers, hand-rolled
orchestration (no LangChain), Zod at the HTTP boundary.

## Stack

- NestJS 10 on Node 20
- Zod for request validation (no class-validator)
- jsonwebtoken for Supabase HS256 JWT verification
- Claude is invoked **via the `claude` CLI subprocess only** — the hosted
  Anthropic API is forbidden by project directive. Do not wire an SDK or
  add `ANTHROPIC_API_KEY`.
- Qdrant + Redis via `docker-compose.yml`
- Python subprocess for retrieval (Phase 0 hack, to be replaced)

## Layout

```
src/
├── main.ts                 bootstrap, /healthz wired here via HealthController
├── app.module.ts           wires every module + the auth middleware
├── health.controller.ts
├── common/
│   ├── request-with-user.ts
│   ├── not-implemented.ts
│   └── zod-pipe.ts
├── schemas/                Zod schemas — every endpoint's input/output
│   ├── vocab.ts            controlled vocabularies (mirrored from voice/memory-taxonomy.md)
│   ├── profiles.schema.ts
│   ├── reflection.schema.ts
│   ├── memory.schema.ts
│   ├── future-self.schema.ts
│   ├── safety.schema.ts
│   └── retrieval.schema.ts
├── auth/                   Supabase JWT middleware → req.user
├── profiles/               GET/PATCH /profiles/me
├── reflection/             POST/GET /journal-entries, POST/GET /chat-messages
├── memory/                 GET /memories (?include_sealed=false default)
├── future-self/            GET /future-selves, GET/POST /future-letters
├── safety/                 POST /safety/classify (stub: { signal: null })
└── retrieval/              POST /retrieve (subprocess into Python retriever)
```

## Endpoints

| Method | Path                | Status (phase 0)   |
|--------|---------------------|--------------------|
| GET    | `/healthz`          | 200 `{status,version}` |
| GET    | `/profiles/me`      | 501 placeholder    |
| PATCH  | `/profiles/me`      | 501 placeholder    |
| POST   | `/journal-entries`  | 501 placeholder    |
| GET    | `/journal-entries`  | 200 `[]`           |
| POST   | `/chat-messages`    | 501 placeholder    |
| GET    | `/chat-messages`    | 200 `[]`           |
| GET    | `/memories`         | 200 `[]`           |
| GET    | `/future-selves`    | 200 `[]`           |
| GET    | `/future-letters`   | 200 `[]`           |
| POST   | `/future-letters`   | 501 placeholder    |
| POST   | `/safety/classify`  | 200 `{signal:null}`|
| POST   | `/retrieve`         | 200 (subprocess)   |

All routes except `/healthz` require `Authorization: Bearer <supabase-jwt>`.

## Local dev

```bash
cp .env.example .env       # then read the credential-isolation note below
npm install
npm run start:dev
curl localhost:3001/healthz
```

## Deployment — credential isolation (READ THIS)

The crisis-containment architecture (STEP 4B/4C, `docs/safety-boundary.md`)
relies on **four separate database credentials**, not application logic:

| Env var | Role | May reach |
|---|---|---|
| `DATABASE_URL` | privileged (migrations/admin only) | everything — **never used at runtime** |
| `QUARANTINE_DATABASE_URL` | `mello_quarantine_rw` | only `quarantine.crisis_entries` |
| `SAFETY_EVENTS_DATABASE_URL` | `mello_safety_events_append` | INSERT-only on `public.safety_events` |
| `SUPPRESSION_DATABASE_URL` | `mello_suppression_rw` | only the proactive-pause column |

**Collapsing any of these into one shared URL silently defeats the
containment model without changing a line of crisis code.** This is the
single highest-risk deployment mistake. The roles are created by
`backend/migrations/` (0012/0013/0014); each `*_DATABASE_URL` must be a
distinct least-privilege credential. The API runtime must never use
`DATABASE_URL`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Brings up `api` (3001), `qdrant` (6333/6334), `redis` (6379).

## Coordination

- Tables (`public.users`, `public.profiles`, etc.) come from
  `backend/migrations/`. This API does not run migrations.
- Memory shape mirrors the Distiller output in
  `voice/memory-taxonomy.md` (v0.1).
- Retrieval shells out to `../retriever/retriever.py` for now — a real
  TS Qdrant + Voyage client lands when the retriever stabilises. The
  relative path resolves from the API process cwd; a containerized API
  must colocate the retriever tree.

## Non-goals (phase 0)

- No reflective-product prompt assembly or streaming yet. (The STEP 4
  safety classifier already invokes the `claude` CLI — CLI only, never
  the hosted API.)
- No LangChain. Ever.
- No Supabase Postgres client wired yet — services return placeholders.
- No queue worker, no scheduled jobs.

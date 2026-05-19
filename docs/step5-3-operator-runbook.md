# STEP 5-3 — Operator Runbook (Internal Alpha)

Procedure to stand up the alpha. Process, not code. Nothing here changes
crisis policy.

> ## MODE: LOCAL ONLY (current — VPS deferred, 2026-05-19)
>
> Testing is **local docker-compose on the dev machine, for now. Not yet
> deployed to a VPS.** The Dockerfile/compose artifacts are retained
> unchanged as the eventual VPS path; only the *where* changes. Use
> **§L (Local quickstart)** below. The VPS-specific steps (§0 prereq
> "a VPS", reverse proxy / TLS / public invite gate) are **deferred —
> do not provision them yet.** Every safety invariant still applies
> locally: the S5-1 boot guard, the deploy-smoke gate, credential
> isolation, no `ANTHROPIC_API_KEY`, adults/invite-only.

## L. Local quickstart (current mode)

1. **Mint the token on THIS machine** (the container has no host auth):
   `claude setup-token` → copy the printed token.
2. **Create `deploy/alpha.env`** from `deploy/alpha.env.example`
   (git-ignored; never committed). For local testing the three
   `*_DATABASE_URL` still point at the Supabase project as **four
   distinct roles** (Supabase is managed, independent of VPS). Set
   `CLAUDE_CODE_OAUTH_TOKEN`, `SUPABASE_JWT_SECRET`, `VOYAGE_API_KEY`.
   Do **not** set `ANTHROPIC_API_KEY`.
3. **Migrations** (once, admin URL, not in alpha.env) — §3 below.
4. **Up:** `docker compose -f docker-compose.alpha.yml up --build -d`
   - API is at `http://127.0.0.1:3001` (local only; no proxy/TLS needed
     in local mode). Qdrant stays internal.
   - If the API container exits on boot, that is the S5-1 guard —
     fix `alpha.env`, never collapse credentials to "make it start".
5. **Smoke gate:** `./scripts/deploy-smoke.sh http://127.0.0.1:3001`
   — non-zero = do not proceed. Block A always runs; Block B checks the
   local endpoint (public registration unreachable, route not bypassable).
6. Stop here. No VPS, no public exposure, invite/adults-only still apply.

The numbered sections below are the **full VPS runbook**, retained for
when VPS deployment is taken up later. In local mode follow §L; treat
"VPS" wording in §0/§4 as "this machine / deferred".

---

Off-keyboard operator procedure to stand up the single-VPS alpha
(retained for the deferred VPS phase). Engineering ships the artifacts;
the operator provisions the host and secrets.

## 0. Prereqs
- A VPS with Docker + Docker Compose.
- An external Postgres (Supabase) with the schema applied and the four
  least-privilege roles created (migrations `0012`–`0014`).
- A Claude **subscription** (Pro/Max/Team/Enterprise) — NOT an API key.
- Voyage API key; Supabase JWT secret.

## 1. Mint the Claude CLI token (one-time, OFF the image)
On a trusted machine (not in the image, not in CI logs):
```
claude setup-token
```
- Completes a browser OAuth once; prints a **~1-year** token.
- It is saved nowhere — copy it now.
- Verified mechanism (Claude Code v2.1.x): the runtime reads it from the
  env var **`CLAUDE_CODE_OAUTH_TOKEN`**. No API key, no interactive
  login, no `~/.claude` mount needed.
- **Rotation:** the token expires (~1 year) — diary a refresh.
- **Note (cost):** from 2026-06-15, `claude -p` on subscription draws
  from a separate Agent-SDK credit allocation. Monitor quota.

## 2. Create `deploy/alpha.env` (operator-managed, NEVER committed)
`deploy/alpha.env` is git-ignored AND excluded from the Docker build
context (`.dockerignore`). It must contain:
```
# Four DISTINCT Supabase roles — never the same URL, never the admin URL.
QUARANTINE_DATABASE_URL=postgres://mello_quarantine_rw:...@<supabase-host>/postgres
SAFETY_EVENTS_DATABASE_URL=postgres://mello_safety_events_append:...@<supabase-host>/postgres
SUPPRESSION_DATABASE_URL=postgres://mello_suppression_rw:...@<supabase-host>/postgres
SUPABASE_JWT_SECRET=...
VOYAGE_API_KEY=pa-...
CLAUDE_CODE_OAUTH_TOKEN=<token from step 1>
# Do NOT set ANTHROPIC_API_KEY. It would take precedence over the OAuth
# token and violates the CLI-only directive. Compose forces it empty.
```
The S5-1 guard refuses to boot if any of the three `*_DATABASE_URL` are
missing, blank, equal to each other, or equal to the admin/migration
`DATABASE_URL`. Confirm they are four genuinely distinct roles.

## 3. Apply migrations (once, with the ADMIN connection — not in alpha.env)
```
DATABASE_URL=postgres://<admin>@<supabase-host>/postgres \
  ./backend/migrations/apply.sh
```
The admin `DATABASE_URL` is used ONLY here and never enters the api
runtime env.

## 4. Build + bring up
```
docker compose -f docker-compose.alpha.yml build
docker compose -f docker-compose.alpha.yml up -d
```
- Qdrant is internal-only (no published port).
- The API binds `127.0.0.1:3001` — put the operator's reverse
  proxy / TLS / invite gate in front of it. Do **not** expose 3001
  publicly without the gate.
- If the API container exits during boot, that is the S5-1 guard
  refusing collapsed/missing credentials — fix `alpha.env`, do not
  bypass the guard, do not collapse credentials "to make it start".

## 5. Deploy-smoke gate (mandatory; non-zero = do not serve)
```
./scripts/deploy-smoke.sh https://<alpha-domain>
```
Blocks the deploy if: firebreak does not fire, crisis text reaches
logs/journal/memory, classifier fail-closed regressed, quarantine-fail
falls back, public registration is reachable, or a protected route is
bypassable. Treat any failure as a hard stop.

## 6. Invariants the operator must not break
- Never put `ANTHROPIC_API_KEY` anywhere.
- Never bake `CLAUDE_CODE_OAUTH_TOKEN` into the image or commit
  `deploy/alpha.env`.
- Never pass `--bare` to the CLI (it ignores the OAuth token).
- Never collapse the four DB credentials.
- Never publish Qdrant or expose the API without the invite gate.
- Adults-only, invite-only, no paid, no public signup, no analytics/ads
  on journal/crisis content (4D-R §6). Public launch stays blocked on
  the external 4D review.

## 7. Out of scope here (gated)
Public registration, 4E wording, A2 crisis-arm deletion, onboarding
free-text, Rooms 2–7, billing. The 4D packet remains the public-launch
review gate.

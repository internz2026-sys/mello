# STEP 5-3 — Alpha Compose / Docker Spec (REVIEW — no files built yet)

**Status:** design/spec review. **No Dockerfile, compose, or script
written in this pass.** Infrastructure composition only — no crisis
code, classifier, bridge wording, retention, or policy is changed.

> ## DECISIONS LOCKED (2026-05-19)
> - **§9 → 9a:** Claude CLI installed in the api image; auth via a
>   long-lived **Claude Code OAuth token injected as a runtime secret**
>   (no `ANTHROPIC_API_KEY`, no interactive login, no baked credential).
>   **Pre-build blocker:** the exact token env-var / setup command must
>   be verified against the *installed* `claude` CLI version before the
>   Dockerfile hard-codes it (do not assume; treat as `[verify]`). 9b
>   (mounted host cred dir) is the documented fallback.
> - **§3 → Supabase, four roles:** no Postgres container. The four
>   `*_DATABASE_URL` are four distinct least-privilege roles on the
>   external Supabase Postgres. VPS = `api` + `qdrant` only. Isolation is
>   by role, preserved; S5-1 guard still enforces distinctness at boot.

**Checkpoint context:** `e9ff63d`; tsc 0; 9 suites/100 pass/41 gated;
S5-1 credential guard + S5-2 deploy smoke landed.

## 1. Goal

One single-VPS alpha environment where the API runs with the Python
retriever colocated, Qdrant runs, the four-credential isolation is
preserved and *enforced at boot*, deploy smoke can run, public
registration stays blocked, and **no secret is ever baked into the
image**.

## 2. Container topology (proposed)

| Service | In compose? | Notes |
|---|---|---|
| `api` | yes | Node runtime + built API **+ Python3 + `retriever/` + its requirements + Claude CLI**. One image; `RETRIEVER_ENTRYPOINT` resolves to an in-image absolute path (fixes AD-3 by construction). |
| `qdrant` | yes | Internal network only; **not** port-published to the host/public. Reached as `http://qdrant:6333`. |
| `nginx`/TLS | later/optional | Reverse proxy + TLS + the invite gate in front of `api`. Operator-owned; not required to prove the stack runs. |
| Postgres | **no container** | See §3 — Postgres is external (Supabase); the four safety credentials are four distinct least-privilege roles on it. |

**Decision to confirm (§3):** Postgres location. Recommended: the four
`*_DATABASE_URL` are four distinct Supabase roles on the same external
Postgres (matches migrations 0012–0014, keeps the VPS to `api`+`qdrant`).
Alternative: a dedicated Postgres container — heavier, not needed for
alpha. **No code change either way**; only the connection strings differ.

## 3. Why no Postgres container (proposed)

`backend/migrations/` creates the roles `mello_quarantine_rw`,
`mello_safety_events_append`, `mello_suppression_rw` on a Postgres.
Supabase *is* a Postgres; the alpha can point the four `*_DATABASE_URL`
at that single instance with four separate roles. Auth already uses
Supabase (`SUPABASE_JWT_SECRET`). This keeps the VPS minimal and the
isolation intact (isolation is by *role/credential*, not by separate
servers). The admin/migration `DATABASE_URL` is used **once, off the
runtime path**, by `apply.sh` — never in the `api` container env.

## 4. Image structure (proposed, multi-stage)

1. **build stage** (node): install deps, `nest build` → `dist/`.
2. **runtime stage**: slim Node base **+ python3 + pip** ; copy `dist/`,
   production `node_modules`, and `retriever/` + `pip install -r
   retriever/requirements.txt`; install the Claude CLI (§9); set
   `RETRIEVER_PYTHON_BIN=python3` and `RETRIEVER_ENTRYPOINT=<abs path to
   the copied retriever/retriever.py>`.
3. Non-root user; no secrets; `CMD` runs the API (S5-1 guard fires first).

`distiller/` is **not** required in the alpha image (batch tool, not in
the request path) — exclude unless/until an alpha feature needs it.

## 5. Secrets injection (proposed)

Runtime env via an operator-managed `--env-file` (e.g. `.env.alpha`,
**git-ignored, never in Docker build context**) or host/Docker secrets:

Required at runtime:
`QUARANTINE_DATABASE_URL`, `SAFETY_EVENTS_DATABASE_URL`,
`SUPPRESSION_DATABASE_URL` (three **distinct** roles),
`SUPABASE_JWT_SECRET`, `VOYAGE_API_KEY`, `QDRANT_URL`,
`RETRIEVER_ENTRYPOINT`, `RETRIEVER_PYTHON_BIN`, plus the Claude CLI auth
input from §9.

Forbidden: **`ANTHROPIC_API_KEY`** (CLI-only directive; AD-2). The
`.dockerignore` must exclude `.env`, `.env.*`, `**/.env`, `node_modules`,
`.git`, `docs/legal-clinical-review/*.pdf|*.html` build outputs, and any
local creds so the build context cannot copy a secret into a layer.
`DATABASE_URL` (admin) is **not** in the api runtime env.

The S5-1 guard runs at boot: missing/blank/duplicated/admin-collision →
process exits non-zero. Compose must **not** mask this with an infinite
`restart:` loop — use `restart: "no"` (or `on-failure` with a low cap)
so a collapsed-credential deploy fails visibly, not silently.

## 6. Qdrant

`qdrant` on the compose-internal network only; `QDRANT_URL=http://qdrant:6333`
in the api env; no host port mapping (memory vectors are not in the
crisis path, but there is no reason to expose them). Volume for
persistence is operator-owned.

## 7. Deploy smoke invocation (S5-2)

After the stack is up and reachable at the alpha URL:

```
ALPHA_BASE_URL=https://<alpha-domain> npx jest deploy-smoke
```

(or a thin `scripts/deploy-smoke.sh` wrapper). Block A always runs;
Block B enforces public-registration-unreachable + protected-route-not-
bypassable against the live target. **Non-zero exit = failed deploy.**
The deploy procedure must treat a smoke failure as a hard stop (no
"deploy anyway").

## 8. Acceptance criteria

**Spec ready (this doc) when it answers:** containers (§2) · which image
holds the retriever (§4) · where Claude CLI runs (§9) · how the four
credentials are injected (§5) · how Qdrant is reached (§6) · how the app
refuses collapsed creds (§5, S5-1) · how deploy smoke runs (§7) · what
fails the deploy (§5/§7) · what is operator-owned (§10). — **All
answered here except §9, which needs your decision.**

**Implementation done (later) when:** `docker compose config` passes ·
api image builds · api starts with distinct placeholder creds and
**refuses** collapsed creds · `retriever.py` path resolves *inside* the
container · qdrant reachable from api · deploy smoke runnable against
`ALPHA_BASE_URL` · no secret in any image layer · public registration
not reachable.

## 9. OPEN DECISION — Claude CLI authentication in-container

The classifier (4B) and distiller call the `claude` CLI. CLI-only is a
hard directive (no `ANTHROPIC_API_KEY`). A container has no interactive
login. Three ways to give the in-image CLI credentials **without baking a
secret or interactive auth into the image**:

| Option | How | Pros | Cons |
|---|---|---|---|
| **9a. Runtime OAuth token (recommended)** | Install CLI in image; inject a long-lived Claude Code OAuth token as a **runtime env secret** (generated once by the operator via the CLI's token-setup flow), exactly like the DB URLs. | No key, no interactive auth, no baked cred; token rotates like any secret; clean parity with other secrets. | Exact env-var/command name must be **verified against the installed CLI version** before build (do not assume). |
| 9b. Mounted host credential dir | Operator runs `claude` login once on the VPS host; mount that credential dir **read-only** into the container at runtime. | No secret in image; uses existing host auth. | Couples container to host state; backup/rotation is manual; mount path must be correct. |
| 9c. CLI on host, API execs host binary | Keep CLI on host; API calls out via a bridge. | CLI fully outside the image. | Most complex; breaks the clean "API image is self-contained" goal; not recommended. |

**Recommendation: 9a**, with **9b as the documented fallback** if the
token mechanism is unavailable in the pinned CLI version. I will not
hard-code a token command/env name in the Dockerfile until the exact
mechanism is confirmed for the installed `claude` version — stating it
unverified would be the same class of error as an unverified citation.

## 10. Operator-owned (off-keyboard)

VPS provisioning; the `.env.alpha` secret file (four distinct DB roles,
`SUPABASE_JWT_SECRET`, `VOYAGE_API_KEY`, Claude auth per §9); running
migrations once with the admin `DATABASE_URL`; TLS/nginx + invite gate;
the invite/account seed; choosing 9a vs 9b.

## 11. What S5-3 must NOT do

No crisis code / classifier prompt / bridge wording / retention / 4E /
A2 deletion / Rooms 2–7 / public registration / analytics / billing. No
`ANTHROPIC_API_KEY`. No `.env` in build context. No restart loop that
hides a credential-guard failure. No startup-guard bypass flag.

## 12. Tracking → `docs/follow-ups.md`

S5-3a image (multi-stage, retriever+CLI colocated) · S5-3b
`docker-compose.alpha.yml` (api+qdrant, no restart-mask) · S5-3c
`.dockerignore` (secret/context hygiene) · S5-3d `scripts/deploy-smoke.sh`
· S5-3e doc: operator runbook (secrets, migrations, §9 choice). Build
order gated on the §9 decision.

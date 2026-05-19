# Architecture Debt Review (Spec / Findings Only)

**Status:** review + findings only. **No code changed; nothing
implemented.** Safe while 4D is externally blocked. Every item is an
*observation + recommended remediation phase* — not an action taken.

## 1. Problem / Goal

Identify technical risks that could block or destabilize Phase 1
implementation, **without** changing crisis, deletion, retention, or
onboarding policy. Produce a ranked, evidence-cited list so Phase 1 work
can be sequenced around real risk instead of discovered mid-build.

## 2. Technical Context

Monorepo: `api/` (NestJS), `apps/web` (Next.js), `apps/mobile` (Expo),
`distiller/` + `retriever/` (Python, CLI/subprocess), `backend/migrations`
(Postgres), `api/src/safety/**` (STEP 4 — **frozen, out of scope here**).
Phase 0 posture throughout; several acknowledged "Phase 0 hack" seams.

## 3. What was reviewed

api module boundaries · web/mobile shared types · Supabase auth
assumptions · Qdrant collection strategy · embedding-provider
abstraction · Claude CLI subprocess risks outside safety · environment
variable inventory · deployment/VPS operational risks · test coverage
outside safety · schema/API drift · Room 2–7 implementation
dependencies.

## 4. What was NOT touched (guardrails honoured)

No STEP 4 / crisis code read for modification or altered. No A2 deletion
implemented. No retention decided. No mobile free-text started. No Rooms
2–7 built. Where a finding *touches* the safety subsystem (AD-1), it is
recorded strictly as an **ops/scaffolding** observation about
environment configuration — the remediation is a doc/`.env.example`
change, never a crisis-code or policy change, and is explicitly deferred
to a later task.

## 5. Findings format

`AD-n · Area · Severity · Evidence (path) · Impact · Recommended
remediation (phase — not done now)`

Severity tiers: **P0 pre-Phase-1 blocker** · **P1 high before beta** ·
**P2 medium before scale** · **P3 deferred / acceptable debt**.

---

## 6. Findings (ranked)

### P0 — Pre-Phase-1 blockers

**AD-1 · Env inventory / deployment · P0**
`api/.env.example` documents **no database URL at all** — not the app
DB, and **none of the four isolated safety credentials**
(`QUARANTINE_DATABASE_URL`, `SAFETY_EVENTS_DATABASE_URL`,
`SUPPRESSION_DATABASE_URL`, plus the app `DATABASE_URL`).
*Evidence:* `api/.env.example` (full file lists Supabase, Anthropic,
Voyage, Qdrant, Redis, retriever, PORT — zero DB URLs).
*Impact:* an operator copying `.env.example`→`.env` gets a non-functional
API; the safety subsystem fails closed everywhere; the tempting "fix" is
a single shared DB URL, which **silently collapses the credential
isolation that 4B/4C/4D depend on**. This is the highest-leverage
finding: a config mistake here defeats the entire crisis architecture
without touching a line of crisis code.
*Recommended remediation (later, doc/scaffolding task):* add all required
DB URLs to `api/.env.example` as **distinct, clearly-commented**
variables with a warning that they MUST be separate credentials; do not
modify any safety module. Pre-Phase-1.

**AD-2 · Claude CLI / project constraint · P0**
`ANTHROPIC_API_KEY` is present in **api** and **retriever** `.env.example`.
*Correction (2026-05-19):* the initial finding said "all three" — the
`distiller/.env.example` grep hit was the comment *"No ANTHROPIC_API_KEY
needed"*; distiller was already compliant and exemplary. AD-2 applies to
`api` and `retriever` only.
*Evidence:* `api/.env.example` ("# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-..."); `retriever/.env.example`
("ANTHROPIC_API_KEY=sk-ant-your-key-here ... reserved for downstream
reranking").
*Impact:* directly invites the one path the project forbids — direct
Anthropic API use. All Claude calls must route through the `claude -p`
CLI subprocess (load-bearing for cost, and for the no-hosted-API
posture). The key in scaffolding is a latent regression footgun;
a future contributor will wire an SDK to it.
*Recommended remediation (later):* remove `ANTHROPIC_API_KEY` from all
`.env.example`; replace with a commented note "Claude is invoked via the
`claude` CLI (`CLAUDE_CLI`), never the hosted API — do not add an API
key." Pre-Phase-1.

**AD-3 · Retriever entrypoint drift · P0**
`api/.env.example` sets `RETRIEVER_ENTRYPOINT=../retriever/retrieve.py`,
but no `retrieve.py` exists — the actual file is `retriever/retriever.py`.
*Evidence:* `ls retriever/*.py` → `embeddings.py retriever.py seeder.py`;
env default names `retrieve.py`.
*Impact:* retrieval is broken on a fresh env copy; additionally the
relative `../retriever/...` path will not resolve inside a containerized
API (the API image does not contain the retriever tree).
*Recommended remediation (later):* correct the default to the real
filename and document the API-container ↔ retriever colocation
requirement (or replace the shell-out — see AD-7). Pre-Phase-1.

### P1 — High risk before beta

**AD-4 · web/mobile shared types · P1**
No shared types/workspace package (`packages/`, `libs/`, `shared/` absent).
*Evidence:* `api/src/schemas/*.ts` (zod) is the only contract; frontends
have no import path to it.
*Impact:* api ↔ web ↔ mobile types are hand-redeclared → schema/API
drift; the only cross-platform check today is a brand-string e2e test.
*Recommended remediation (later):* extract `api/src/schemas` (or a
generated d.ts) into a shared package consumed by web/mobile, or generate
an OpenAPI/zod client. Before beta.

**AD-5 · Test coverage outside safety · P1**
Outside `api/src/safety` (which is well-covered and frozen) there are
**two** test files total.
*Evidence:* find — only `e2e/tests/01-welcome.spec.ts` and
`02-onboarding-room-1.spec.ts`; no unit tests for auth middleware,
profiles, memory, retrieval, future-self, distiller, retriever.
*Impact:* the entire non-safety system is unguarded against regression
exactly as Phase 1 begins to build on it.
*Recommended remediation (later):* unit coverage for the auth middleware
and each service's contract before that service ships Phase 1 surface.
Before beta; prioritized per service as it lights up.

**AD-6 · Supabase auth assumption · P1**
Auth middleware validates **HS256 against `SUPABASE_JWT_SECRET`**;
RS256/JWKS (asymmetric) is explicitly "out of scope for Phase 0."
*Evidence:* `api/src/auth/supabase-auth.middleware.ts` header comment +
`jsonwebtoken` HS256 path.
*Impact:* Supabase has been moving projects to asymmetric JWT signing
keys; a real project may not validate against a shared secret, and claim
handling (`aud`/`exp`/`role`) needs confirmation. Auth could fail or be
weak in a real deployment.
*Recommended remediation (later):* verify the target Supabase project's
signing scheme; add a JWKS path if asymmetric; assert `exp`/`aud`.
Before beta.

**AD-7 · Cross-language subprocess in request path · P1**
NestJS `retrieval.service.ts` `spawn`s Python (`retriever.py`) per
request — acknowledged "Phase 0 hack."
*Evidence:* `api/src/retrieval/retrieval.service.ts` (spawn; warns on
failure, no evident timeout); `RETRIEVER_PYTHON_BIN` env.
*Impact:* deployment coupling (API container must also ship Python + the
retriever tree — see AD-3), latency, and a hung Python has no visible
timeout/circuit-breaker (unlike the hardened safety classifier).
*Recommended remediation (later):* add a timeout + bounded failure
handling; medium-term replace with a service boundary (HTTP/queue).
Before beta for the timeout; scale for the boundary.

### P2 — Medium risk before scale

**AD-8 · Qdrant collection strategy · P2**
Collection is provider+dim-scoped (`mello_memories` base); switching
embedding provider creates a new physical collection.
*Evidence:* `retriever/embeddings.py` `collection_name(base, provider)`.
*Impact:* no documented migration/backfill path between collections;
orphaned vectors on provider switch (also ties to A2 Qdrant deletion).
*Recommended remediation (later):* document a re-embed/backfill +
old-collection-retire procedure. Before scale / provider switch.

**AD-9 · Rooms 2–7 service dependencies · P2**
`future-self`, `reflection`, `profiles` controllers are 501 stubs.
*Evidence:* `api/src/common/not-implemented.ts` referenced by those
controllers.
*Impact:* MO-5 (web Rooms 2–7) is **not just UI** — Room 4 (Becoming /
Future Self) and Room 7 (seed letter) depend on real future-self /
memory / distiller services that don't exist yet. Building Rooms 2–7
without them yields hollow rooms.
*Recommended remediation (later):* sequence MO-5 behind the
future-self/reflection service implementations; document the dependency
in the onboarding brief. Before the Rooms 2–7 build starts.

**AD-10 · Jobs/queue infrastructure absent · P2**
`REDIS_URL` is declared "jobs / rate-limit later"; no queue/worker
system exists.
*Evidence:* `api/.env.example` comment; no worker module in `api/src`.
*Impact:* A2's `deletion_jobs` saga, the suppression time-box, and
distiller batch all need durable jobs; the absence is latent debt that
several roadmap items silently assume.
*Recommended remediation (later):* choose the job substrate before the
first durable-job feature (likely A2 mechanism or distiller scheduling).
Before scale.

**AD-11 · Non-safety Claude CLI error discipline · P2**
`distiller.py` invokes the `claude` CLI without the structural-token /
timeout hardening the safety classifier received in 4B-H/B3.
*Evidence:* grep — `distiller/distiller.py` uses the CLI;
`retrieval.service.ts` warns-only on spawn failure.
*Impact:* non-safety, so not a fail-closed concern — but unbounded/poorly
surfaced subprocess errors are an operational and debugging risk.
*Recommended remediation (later):* apply timeout + structured error
logging consistent with the (frozen) classifier pattern, **without
importing or touching the safety modules**. Before beta.

### P3 — Deferred / acceptable debt

- **AD-12 · Billing · P3** — `subscriptions` table (migration 0011)
  exists with no billing module; launch concern, not Phase 1.
- **AD-13 · Retriever shell-out · P3** — acceptable for Phase 1 if AD-3
  fixed and AD-7 timeout added; replace with a real boundary before
  scale.
- **AD-14 · Voice primitives duplicated · P3** — `apps/mobile/lib/voice`
  parallels web conceptually; acceptable until AD-4's shared package
  exists.

---

## 7. Acceptance criteria

- A ranked, evidence-cited list exists (P0→P3). ✔
- Every finding has a file-level evidence pointer, an impact, and a
  remediation phase. ✔
- Nothing was implemented; no STEP 4 / crisis / A2 / retention /
  onboarding-free-text / Rooms-2–7 work was started or altered. ✔
- The highest-leverage finding (AD-1) is identified explicitly as
  protecting the isolation 4B/4C/4D rely on, with a remediation that is
  scaffolding-only and crisis-code-untouching. ✔

## 8. Security / Architectural Integrity

The core invariant is unchanged: *crisis material is acute-state
material, not identity truth*, enforced by credential isolation. **AD-1
is the architectural risk that matters most**: the isolation is real in
code but undocumented in `.env.example`, so a deployment mistake — not a
code change — could collapse it. Reviewing it now (and remediating it
later as a pure scaffolding/doc task) hardens the deployment surface
without reopening the frozen crisis code. AD-2 similarly protects the
no-hosted-API posture. Neither remediation may modify a safety module or
any 4D-gated policy; both are config-surface only and remain deferred
until explicitly scheduled.

## 9. Follow-ups → `docs/follow-ups.md`

AD-1…AD-3 (P0) recommended as the first Phase-1 hardening batch
(scaffolding/docs only). AD-4…AD-11 logged as phased debt. AD-12…AD-14
acceptable. None block the true critical path, which remains: **route
the 4D packet to counsel.**

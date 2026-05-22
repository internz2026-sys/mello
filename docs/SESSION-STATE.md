# mellō — Session State & Continuity Knowledgebase

**Purpose:** the durable, account-independent, machine-independent memory
of this build. It is committed to git, so any new Claude session — on any
account, any machine (just `git clone`) — can reconstruct full context by
reading this file first. **If you are a fresh session: read this top to
bottom, then `docs/follow-ups.md`, then `CLAUDE.md`.**

**Last updated:** 2026-05-22.

> **All identifiers, paths, and slugs use the ASCII `mello`** (brand mellō).
> Repo path: `c:\Users\Admin\Documents\mello`. Hooks
> (SessionStart / SessionEnd / Stop) are registered in
> `.claude/settings.json`. Local transcripts and project memory live under
> the project key `c--Users-Admin-Documents-mello`. Git history was rewritten
> on 2026-05-22 so no commit content references the prior name.

---

## How to resume this work (any account / machine)

1. **Same machine, any Claude account:** `claude --resume` in
   `C:\Users\Admin\Documents\mello` and pick session
   `0e1082ad-a35a-472d-ac84-1927548aa7e9` (verbatim ~11 MB transcript under
   the project key `c--Users-Admin-Documents-mello`). Account switch does
   NOT affect this — transcripts are local files, not account-bound.
2. **Different machine / fresh session:** clone the repo, read this file
   + `docs/follow-ups.md`. The verbatim transcript only travels if you
   copied `…/0e1082ad-….jsonl` (see "Verbatim backup" below).
3. Greeting marker for continuity: a session begins with “I am Mello
   agent” (CLAUDE.md hook).

## Verbatim backup (optional, for true word-for-word)

The committed docs preserve every decision and commit. For literal
word-for-word, copy the transcript out of `.claude` (it is large and may
contain working detail — keep it private):
`copy "%USERPROFILE%\.claude\projects\c--Users-Admin-Documents-mello\0e1082ad-a35a-472d-ac84-1927548aa7e9.jsonl" <somewhere-durable>`

---

## What mellō is (one paragraph)

An emotionally intelligent reflective-journaling + memory practice (Greek
μέλλω, “I am about to”) — future-self formation, Christian-formation-rooted
but subtle/welcoming, NOT productivity/self-help. Core thesis: “a
reflective memory system with a voice,” not a chatbot. Voice docs in
`voice/` are the source of truth.

## Standing constraints (DO NOT VIOLATE — load-bearing)

- **No Anthropic API ever.** All Claude calls go through the `claude` CLI
  subprocess (`claude -p`), never the hosted SDK. No `ANTHROPIC_API_KEY`.
- **STEP 4 (crisis firebreak) is FROZEN** post-review/hardening. Do not
  change crisis classifier thresholds, bridge wording, retention,
  abuse-disclosure, human-review, or quarantine/safety_events behaviour
  without explicit go.
- **4D (legal/clinical review) gates PUBLIC launch + crisis-policy
  finalization.** It is external/off-keyboard. Engineering must not invent
  any OPEN-4D value (thresholds, retention, reporting, region defaults).
- **4D-R interim rule:** a constrained internal alpha MAY proceed
  (adults-only, invite-only, no paid, no claims, no analytics/ads on
  crisis content, firebreak unchanged) — see `docs/research-evidence-dossier.md` §6.
- Crisis material is acute-state material, **not identity truth** — it
  must never reach memory/embeddings/retrieval/future-self.
- Safety work was single-threaded by design; parallel agents only for
  post-implementation review.
- Voice: no exclamation points in product copy; silence is a feature;
  no gamification/streaks; spiritual content opt-in/subtle.

## Where things live

- Voice source of truth: `voice/` (character-bible, onboarding-script, memory-taxonomy)
- Memory engine prototypes: `distiller/` (Python, claude CLI), `retriever/` (Voyage/Qdrant)
- API (NestJS): `api/` — crisis firebreak in `api/src/safety/**` (FROZEN)
- DB schema + isolated roles: `backend/migrations/` (0012–0014 = safety roles)
- Legal/clinical packet (public-launch gate): `docs/legal-clinical-review/`
- Open items + decision trail: `docs/follow-ups.md`
- Alpha deploy: `Dockerfile.alpha`, `docker-compose.alpha.yml` (VPS path),
  `docker-compose.alpha.local.yml` (LOCAL), `docs/step5-3-*`

## Build phase status (2026-05-20)

| Phase | State |
|---|---|
| STEP 1–3 voice/memory/retriever + relevance gate | done |
| STEP 4A–4C crisis firebreak: built, adversarially reviewed, hardened, 39/39 live corpus clean | done, FROZEN |
| 4D prep: counsel packet + reproducible PDF | done; re-scoped to public-launch gate |
| 4D-R: research dossier + interim alpha constraints | done |
| A2 right-to-delete cascade | spec only |
| Mobile onboarding | Option C locked; Phase-1 brief |
| Architecture debt review + AD-1–3 remediation | done |
| STEP 5 internal alpha (S5-1 guard, S5-2 deploy smoke, S5-3 compose/runbook) | built + image build verified |
| STEP 5 local bring-up (Postgres container + 9b host-Claude mount) | IN PROGRESS — see below |
| 4E final crisis wording / A2 crisis arms / onboarding free-text / Rooms 2–7 | GATED |

## Commit history (history rewritten 2026-05-22 to drop the prior name; snapshot below — run `git log` for current)

- `2562b39` mellō Phase-0 checkpoint: voice + memory engine + STEP 4 crisis firebreak (4B–4D prep), specs
- `ec021e1` docs: define research-backed alpha path and step 5 deploy plan
- `ef1a1e5` feat(alpha): add credential isolation guard and deploy safety smoke tests
- `cded629` docs(alpha): specify single-vps compose plan and claude cli auth boundary
- `2d86c5c` feat(alpha): add local-first compose and deploy-smoke runbook
- `27adc9a` fix(alpha): unset (not empty-set) ANTHROPIC_API_KEY in Dockerfile.alpha
- `6071b99` docs: add SESSION-STATE continuity knowledgebase (account/machine-independent)
- `7a6e2c5` refactor: rename to the mello ASCII slug across identifiers, paths, hooks
- _(+ a follow-up commit recording these post-rewrite hashes)_

## CURRENT WORK — local alpha bring-up (uncommitted)

Goal: run the alpha locally (no VPS, no Supabase) via
`docker-compose.alpha.local.yml`.

Decisions (LOCAL only; VPS path docs retained):
- **Local Postgres container** (Supabase unavailable). Migrations +
  generated login-user bootstrap run via the postgres init hook.
- Migration roles are **NOLOGIN privilege sets** → three **distinct
  login users** each granted one role (deploy/local/initdb/01-local-logins.sql,
  git-ignored; deploy/alpha.env, git-ignored).
- **Claude auth = option 9b**: host `~/.claude/.credentials.json`
  bind-mounted READ-ONLY (existing PC login). No token, no API key.
- Qdrant: compose-managed (internal).

Uncommitted artifacts: `docker-compose.alpha.local.yml`,
`deploy/local/initdb/00-apply-migrations.sh`, `deploy/alpha.env.example`
(fixed: login-users-over-nologin-roles), `.gitignore` (ignores
deploy/local generated SQL), `docs/step5-3-*` updates, `docs/follow-ups.md`.

**Pre-existing 4B DI bug found on first real boot + FIXED (authorized):**
`QuarantineService` and `SafetyEventsAppendService` injected a
TS-interface store via a default param → Nest reflects `Object`, cannot
resolve → app could not boot. Unit tests hand-construct the services, so
nothing ever booted the Nest container (predicted by AD-5 / the leakage
audit). Fix: `@Optional()` on the two store params (default store still
used; ZERO crisis-behaviour change). Added a Nest DI-boot smoke to
`deploy-smoke.spec.ts`. Verified: `tsc 0`, 9 suites / 101 tests pass.

**Last action (rejected by user, then this continuity request):** rebuild
image + `docker compose -f docker-compose.alpha.local.yml up --build -d`
to confirm the API now boots, then `./scripts/deploy-smoke.sh
http://127.0.0.1:3001`. Postgres + Qdrant were healthy; the only blocker
was the DI bug, now fixed but not yet re-run in the container.

**Next concrete steps when resuming the bring-up:**
1. Rebuild + up the local stack; confirm `api` boots past Nest DI.
2. `./scripts/deploy-smoke.sh http://127.0.0.1:3001` (Block A always;
   Block B checks public-reg unreachable + route not bypassable).
3. Commit the local-variant checkpoint (NO secrets — deploy/alpha.env and
   deploy/local/initdb/01-local-logins.sql are git-ignored) + the
   `@Optional()` DI fix + DI-boot smoke.

## Operating discipline that has worked

Spec → confirm → build → verify → commit, one boundary at a time. Surface
contradictions instead of papering over them (e.g. the nologin-roles
discovery, the defective alpha.env.example, the DI bug). Never fabricate
secrets to manufacture a green. Each commit excludes the ambient
`.claude/settings.json`.

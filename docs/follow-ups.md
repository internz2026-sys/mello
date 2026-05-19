# mellō — Phase 1 follow-ups

Consolidated list of work surfaced during the Phase 0 build + the mellō rename/reframe pass that is **not done** and is **not in scope for Phase 0**. Each item references the audit or source that flagged it.

Last updated: 2026-05-16

---

## Blocker-class architectural gaps (must address before any public launch)

These come from the original Architecture Audit (`audits/architecture-audit.md`) and remain unaddressed:

### A1. Crisis pipeline is unspecified
- **Source:** `audits/architecture-audit.md` (2 of 2 blockers)
- **State:** `api/src/safety/safety.controller.ts` is stubbed; returns `{signal: null}` always.
- **Why it's a blocker:** This product attracts vulnerable users by design. An unspecified crisis path is a legal and ethical hazard.
- **Phase 1 work:** Implement the classifier (likely Haiku), wire scripted regional responses (988/Samaritans/etc.), add audit logging via `safety_events` table, schedule legal review of the entire path before any user can submit a journal entry.

### A2. Right-to-delete cascade is promised but not enforced
- **Source:** `audits/architecture-audit.md`
- **State:** The README + character-bible promise full export+delete. The schema has the tables but no orchestrator fans the delete across Postgres → Qdrant → object store → vendor logs → backups.
- **Phase 1 work:** Build a delete-orchestrator service. Define the 30-day SLA. Test the cascade against a real Qdrant + Postgres pair.

---

## Mobile onboarding gap

### M1. Mobile has no Room 1–7 onboarding flow at all
- **Source:** `audits/reconciliation-frontend.md` finding C
- **State:** `apps/mobile/app/index.tsx` Begin button routes straight to `/(rituals)/morning`, skipping every onboarding room. Web has a partial Room 1 (steps 1–4); mobile has nothing.
- **Phase 1 work:** Either (a) build the full 7-room flow in Expo to mirror web, OR (b) explicitly document Phase 0 mobile as "rituals-only — onboarding happens on web" in the README, and gate the Begin button to require an existing account.

---

## Code/data alignment debt

These are surfaced from the Phase 0 build agents producing skeletons that don't yet match the canonical specs in `voice/memory-taxonomy.md`. Some were fixed in the rename pass; the ones below remain:

### C1. Importance formula has no code home
- **Source:** `audits/reconciliation-backend.md` finding E
- **State:** `voice/memory-taxonomy.md` v0.2 defines the importance formula (with `relational_density`, `named_values_or_calling`, `present_attention`, etc.). Zero code references in `distiller/`, `retriever/`, `api/`, or the schema.
- **Phase 1 work:** Implement the formula in the Distiller's scoring step. Test against the sample entries in `distiller/fixtures/sample_entries.json`.

### C2. `qdrant_point_id` has no shared id provider
- **Source:** `audits/reconciliation-backend.md` finding H
- **State:** The schema reserves `qdrant_point_id`, the seeder generates UUID5(user_id, summary), but the Distiller doesn't emit one. The "link" is conceptual.
- **Phase 1 work:** Define the id provider (the Distiller should emit `qdrant_point_id` so Postgres and Qdrant share the same key). Document in `voice/memory-taxonomy.md` so future contributors don't drift.

### C3. Recency signal shape is unpinned
- **Source:** `audits/reconciliation-backend.md` (Notable unspecifieds)
- **State:** Retrieval ranking uses `recency_signal` weighted at 0.2, but the formula isn't specified in the taxonomy. Retriever uses `1 / (1 + days / 30)` heuristically.
- **Phase 1 work:** Pin the formula in `voice/memory-taxonomy.md`. The current heuristic is fine; just lock it.

### C4. User cannot promote sensitivity yet
- **Source:** `audits/reconciliation-backend.md` (Notable unspecifieds) + `voice/memory-taxonomy.md` (Sensitivity belongs to the user)
- **State:** No PATCH endpoint exists for `memories.sensitivity`. The "user can promote (never demote)" rule is documented but not enforced.
- **Phase 1 work:** Add `PATCH /memories/:id/sensitivity` in the API. Validate the promotion-only rule at the API layer (and probably also as a DB trigger as defense-in-depth).

---

## Voice audit v2 — non-blocker items still open

These come from `audits/voice-audit-v2.md`. The blocker (seed letter frame-break) is resolved. The remaining items are not gating.

- **README line 5** ("For the long arc of who you were made to be") — auditor flagged as creator vocabulary above the Formation gate. User chose to keep it as the intentional subtle Christian witness.
- **CLAUDE.md "I am Mello agent"** — stale across the rename, but intentionally retained as a Claude session continuity marker.
- **Future Self letters** — need an explicit "the I is the user's, not mellō's" rule in code comments alongside the bible note. Add to the eventual letter-generator service.

---

## Voice audit v1 — items deferred during the reframe

These were flagged in `audits/voice-audit.md` but consciously deferred:

- **The card-sort at Room 5 Path B** — auditor flagged the UI gesture as a "form in conversational drag." Defer until we have a real design pass on the values selection UX.
- **Self.4 — "That took something to write" rate-limit** — flagged that the phrase becomes a tic if used >1×/week. Add to the guardrail classifier when it ships.

---

## Ontology watch-items (do NOT act on reactively)

### O1. Possible missing theme: "intentional-living"
- **Source:** First distiller chill test (2026-05-16). The Distiller invented the tag `intentional-living` for the friendship-commitment memory — a controlled-vocab violation, now hard-constrained against in the prompt.
- **The deeper question:** the invented tag may have surfaced a real ontology gap. "Intentional living" was a concept in the original product brief but never made it into the controlled theme vocabulary. The closest existing themes (`friendship`, `change`, `practice`) don't quite capture "attentiveness as a way of life."
- **Rule:** Do NOT add it reactively from one output. Taxonomies become junk drawers when expanded from single signals. Review 100–200 real distilled memories first. If the gap recurs across many users' memories — if the model keeps reaching for a concept the vocab can't express — then consider adding a vetted term. Until then, the hard constraint forces the closest existing theme, which is the correct conservative behavior.

## Retrieval philosophy follow-ups (deferred — do NOT implement during STEP 3)

### R-floor. Per-kind similarity floors
- **Source:** retrieval-philosophy discussion, 2026-05-16.
- **Decision for STEP 3:** one universal `SIMILARITY_FLOOR` gate is enough. A memory whose query-similarity falls below the floor is rejected *before* importance/recency weighting — this prevents "gravitational trauma bias" (a high-importance wound surfacing on a light day just because its importance score gives it a floor it can't fall below). Implement the universal gate only *after* the anti-haunting chill test (#5) empirically demonstrates the current formula fails — not speculatively.
- **Deferred nuance (Phase 1+):** not all kinds should share one floor. `wound`, `grief`, `sealed`, relational-injury memories should require a *stricter* (higher) resonance threshold to resurface than `value`, `habit`, `commitment`, `pattern`. A father-wound should need much stronger contextual resonance than "user values consistency." Do not build per-kind floors during STEP 3 — one universal gate first, validated by chill tests, then differentiate.

### R-localbench. Local-embedding benchmark methodology (Phase 2)
- **Source:** embedding-provider decision, 2026-05-16. Option A (Voyage) chosen for Phase 0–1; architected swappable via `retriever/embeddings.py`.
- **Phase 2 task:** before switching `MELLO_EMBEDDING_PROVIDER=local`, benchmark candidate local models against Voyage using **real mellō chill tests** — anti-haunting, right-wound-at-the-right-moment, light-day restraint, growth/contrast, contradiction handling, sealed suppression. **NOT** MTEB or generic semantic-search benchmarks. The only benchmark that matters: "did it surface the right wound at the right moment without forcing it, and did it stay quiet on a light day?"

### R-growth. The growth test must be part of STEP 3
- **Source:** retrieval-philosophy discussion, 2026-05-16.
- Chill test #6: query *"I handled that conversation differently this time."* The retriever should surface past-struggle / prior-avoidance memories **only when the contrast illuminates movement**, not to haunt. Quiet, observed, true ("Three months ago this conversation ended differently") — never motivational ("look how far you've come"). This prevents the memory field from collapsing into a museum of pain. mellō's implicit theology is "a person is still becoming," not "you are your wounds." Part of STEP 3's philosophy-validation suite, not a later optimization.

## Safety / crisis follow-ups

### S3. Post-4B review — deferred (non-blocking) findings
- **Source:** post-4B parallel review (leakage / failure-mode / coverage / voice-safety agents), 2026-05-19. Blockers B1–B4 fixed in the 4B-H hardening pass; the items below are non-blocking and deliberately deferred. Failure-mode audit returned PASS — the runtime firebreak invariant holds.
- **S3a (→ 4D, clinical):** low-confidence `risk:'none'` gate. A well-formed but degraded classifier `none` with very low confidence is currently trusted. Mechanism (a runtime confidence floor → fail-closed) is cheap; the **threshold is a clinical/legal call** and belongs in 4D, not engineering.
- **S3b (doc fidelity):** classifier-failure path uses the full crisis bridge, not the distinct §7 `renderHolding()` screen that already exists. Warm+closed both hold (not a fail-closed violation); it is a §7 wording-fidelity gap. Resolve when §8/§7 wording unfreezes (4E).
- **S3c (doc):** implementation persists fail-closed text to **quarantine**, while §7 says "volatile session memory only." Quarantine is *stricter* (credential-segregated, unreachable to memory engine). Decide: tighten §7 to permit quarantine, or add a code comment explaining why quarantine satisfies §7's intent. Documentation only — do not revert to volatile.
- **S3d (defensive):** wrap both `FAIL_CLOSED_VERDICT` return sites in `crisis-classifier.service.ts` with `enforceVerdictInvariants(...)`. Zero behavioural change today; defends against a future loosening of the frozen constant.
- **S3e (auditability):** `suppression='failed'` is in the `ScreenDecision` but has no `safety_events` enum token. Add `'firebreak:suppression_failed'` (or a structured flag) so the §6.5 cross-session pause failure is auditable.
- **S3f (contract gap, L2):** `quarantine.service.ts` logs `e.message`; `pg` does not echo bound params today, but the contract relies on third-party behaviour. Consider a structural-token error path in the quarantine store mirroring the 4B-H/B3 classifier scrub.
- **S3g (test depth, non-blocking):** add `proactive-suppression.spec.ts` (monotonic `GREATEST`, `isProactiveEngagementPaused` fail-safe→true, `defaultPauseUntil` math) and middleware tests for severity `none→high` coercion and `abuse_disclosure` risk parity. These are real-but-narrow gaps; the §14 release gate is now discharged (B1 covers the classifier; B2 the structural guard).
- **S3h (bridge↔§8 wording drift, → 4E):** `crisis-bridge.templates.ts` ships *"reach a person now"* + an *"I'm reading carefully"* opener; `safety-boundary.md` §8 says *"…tonight. You don't have to do this alone."* §8 wording is FROZEN until 4D; resolve the canonical direction in 4E (final UX wording). Logged, not fixed, by explicit decision.
- **S3i (future-drift hygiene):** `schemas/index.ts` re-exports `FAIL_CLOSED_VERDICT`/verdict types; memory-engine code could import the type to branch on crisis state. No raw text, no active leak. Consider re-exporting verdict *types* only, not the constant. Watch-item.

### S2. The OPEN — 4D items are blocking, not deferrable
- `docs/safety-boundary.md` marks every clinical/legal decision as **OPEN — 4D**: severity thresholds, abuse-disclosure mandatory-reporting exposure, default/fallback `resource_region`, persistent user-state flagging, retention policy, human-review policy, real-time-human-in-loop. These are not "later polish." They gate launch. 4D (legal/clinical review) is the actual critical path for STEP 4 and cannot be closed by engineering.
- **Timing amended 2026-05-19 (4D-R):** these remain **public-launch** blockers, not "nothing runs" blockers. A constrained internal alpha may proceed under `docs/research-evidence-dossier.md` §6 (adults-only, invite-only, no paid, no claims, no analytics/ads on crisis content, firebreak unchanged). The 4D packet is retained, re-scoped as the public-launch gate (`review-packet-index.md` banner). None of the OPEN values may be invented by engineering in the interim.

### 4D-R. Research-backed interim safety basis
- **Doc:** `docs/research-evidence-dossier.md`. Records evidence that the design *direction* (firebreak, human routing, quarantine/minimization, regression-tested classifier) aligns with SAMHSA/WHO/JMIR/FTC and PH RA 10173 / RA 11036 — **citations flagged `[verify]`, not yet human-checked; internal basis only.** §6 = locked interim alpha constraints; §7 = what research cannot decide (still OPEN-4D). Not legal/clinical advice; does not change crisis code or policy values.

## Pre-launch infrastructure follow-ups

### A2. Right-to-delete cascade
- **Spec:** `docs/right-to-delete-cascade.md` (design/spec pass, 2026-05-19) — data inventory, deletion graph, saga orchestration, Qdrant multi-collection delete-by-filter, object-storage forward policy, minimal erasure receipt, backup crypto-shred horizon, failure/recovery.
- Pre-launch blocker. Spec is complete; **implementation is a later explicit task.** Two arms (quarantine purge `A2-2`, `safety_events` cascade-vs-detach `A2-1`) are policy-gated and **cannot be finalized until 4D returns**; the policy-neutral mechanism (`A2-3..A2-7`: deletion_jobs saga, Qdrant helper, object-store key convention, backup horizon, billing-provider deletion) is implementable independently. Sub-items A2-1…A2-7 enumerated in the spec §12.

## Product / onboarding follow-ups

### MO. Mobile onboarding — Phase 1 = Option C (locked 2026-05-19)
- **Decision:** `docs/mobile-onboarding-plan.md` (Option C locked). **Brief:** `docs/mobile-onboarding-phase1-brief.md`. Mobile Phase 1 = Pre-room + Room 1 + resume; web authors Rooms 2–7 first; mobile gets 2–7 in Phase 2. Option A (full mobile onboarding) remains the destination.
- **MO-1** Mobile↔web onboarding hand-off/resume after Room 1 (design item; only relevant under Option C).
- **MO-2** Mobile fail-closed crisis-screen path for onboarding free-text — **blocking** for the Room-1 free-text sub-step. Mirrors the STEP 8 web reference wiring; must fail closed; no offline draft, no sync-later.
- **MO-3** Mobile offline policy for onboarding free-text — default "do not persist unscreened"; blocked on MO-2; not a default to be invented.
- **MO-4** Phase 2 — bring Rooms 2–7 to mobile (reaches Option A). Logged as **committed** scope, not aspirational, to prevent "web-first" becoming "mobile never gets depth."
- **MO-5** Web build of Rooms 2–7 from the canonical onboarding script — Room 6 spiritual opt-in/skippable; Room 7 seed letter web-first and flagged not-stabilized until settled. Each free-text room firebreak-wired (the STEP 8 reference).
- Specs only. Implementation is a later explicit task. MO-2 depends on the STEP 8 firebreak integration path; no onboarding free-text ships on mobile ahead of it.

## Architecture debt

### AD. Architecture-debt review (2026-05-19)
- **Spec:** `docs/architecture-debt-review.md` — ranked, evidence-cited; review only, nothing implemented.
- **P0 pre-Phase-1 — CLOSED 2026-05-19** (scaffolding/docs only; tsc 0, 7 suites/84 tests still green; no crisis code touched). See `## Closed`. `AD-1` `api/.env.example` now documents all four isolated credentials with hard isolation warnings; `AD-2` `ANTHROPIC_API_KEY` removed from `api` + `retriever` (distiller was already compliant — finding corrected); `AD-3` `RETRIEVER_ENTRYPOINT` → `retriever.py` + container-colocation note; `api/README.md` gained a credential-isolation deployment table.
- **P1 before beta:** `AD-4` no shared types (api↔web↔mobile drift); `AD-5` ~zero test coverage outside safety; `AD-6` Supabase HS256-only auth assumption; `AD-7` per-request NestJS→Python spawn, no timeout.
- **P2 before scale:** `AD-8` Qdrant provider-scoped collection migration undocumented; `AD-9` Rooms 2–7 blocked on 501-stub future-self/reflection services (gates MO-5); `AD-10` no job/queue substrate (A2 saga + suppression + distiller assume it); `AD-11` non-safety Claude CLI lacks the classifier's error discipline.
- **P3 acceptable:** `AD-12` billing module absent; `AD-13` retriever shell-out; `AD-14` duplicated voice primitives.
- Specs only; remediation is later explicit work. P0 batch is scaffolding/docs and must not touch any safety module or 4D-gated policy.

## Internal alpha (STEP 5)

### S5. Internal alpha environment — single VPS, docker-compose
- **Spec:** `docs/step5-internal-alpha.md`. Deploy target decided: one VPS (Postgres + Qdrant + API-with-colocated-Python-retriever) behind a private alpha gate. Runs under 4D-R §6 constraints; firebreak unchanged.
- **S5-1** API startup guard: refuse to boot unless the four DB URLs are four *distinct* credentials (operationalizes AD-1; new non-crisis guard + unit test).
- **S5-2** deploy-time safety smoke suite: blocks deploy if firebreak doesn't fire / crisis text reaches logs|journal|memory / fail-closed regressed / public registration reachable / disclaimer bypassable. Verification only, no new crisis logic.
- **S5-3** `deploy/docker-compose.alpha.yml` + API image colocating the retriever (resolves AD-7/AD-3).
- **S5-4** fail-safe-OFF feature flags (paid, public signup, onboarding free-text, future-self-on-unbuilt-services).
- **S5-5** disable public registration; admin invite-seed only (adults-only attested at invite).
- **S5-6** static, non-bypassable alpha disclaimer gate (not therapy / not a crisis service; static copy, not model-generated, separate from the firebreak screen).
- Specs only; §7 of the spec gives the safe-now build order. Nothing 4D-gated is unlocked.

### S5-3. Alpha compose / Docker (spec locked; artifacts built)
- **Spec:** `docs/step5-3-deploy-compose-spec.md`. Decisions locked: **9a** Claude CLI in-image; **Supabase four-roles**, no Postgres container (VPS = api+qdrant).
- **[verify] CLEARED 2026-05-19:** confirmed (Claude Code v2.1.x) — env var `CLAUDE_CODE_OAUTH_TOKEN`, minted by `claude setup-token` (~1yr, subscription, browser-once off-image), fully non-interactive, no API key. Caveats baked in: no `--bare`, `ANTHROPIC_API_KEY` forced empty, token runtime-only (never in an image layer). 9b fallback unused.
- **Built:** **S5-3a** `Dockerfile.alpha` (root context; Node+Python+`retriever/`+Claude CLI; `RETRIEVER_ENTRYPOINT=/app/retriever/retriever.py` absolute → fixes AD-3; non-root; `ANTHROPIC_API_KEY=""`) · **S5-3b** `docker-compose.alpha.yml` (api+qdrant only; qdrant internal; api on 127.0.0.1 behind operator proxy; `restart: on-failure:3` so the S5-1 guard failure stays visible) · **S5-3c** root `.dockerignore` (excludes all `.env`/secrets/`.git`/bulk/`*.spec.ts`) · **S5-3d** `scripts/deploy-smoke.sh` (S5-2 gate; non-zero = no deploy) · **S5-3e** `docs/step5-3-operator-runbook.md`.
- **Validated:** `docker compose -f docker-compose.alpha.yml config` → VALID (Docker 29.2.0, via throwaway env since removed). App tests unaffected (9 suites/100 green). `deploy/alpha.env.example` added; `.gitignore` updated so `deploy/*.env` can never be committed (`!deploy/*.env.example` kept).
- **MODE: LOCAL ONLY (current, 2026-05-19).** Testing is local docker-compose on the dev machine; **VPS deferred** (artifacts retained unchanged as the eventual VPS path). Runbook §L = local quickstart; VPS sections retained for later. All safety invariants apply locally (S5-1 guard, deploy-smoke gate, no API key, invite/adults-only). Image `docker build` not yet run locally (operator step in §L).

## Convention to maintain

When closing a follow-up here, **link the commit/PR that closed it** as a one-line note under the item, and move the item to a `## Closed` section at the bottom of the file. Do not delete; the trail matters.

## Closed

### AD-1 / AD-2 / AD-3. Pre-Phase-1 scaffolding hardening
- **Source:** `docs/architecture-debt-review.md` P0, 2026-05-19.
- **Closed by:** scaffolding/docs-only remediation, 2026-05-19. `api/.env.example` rewritten with the four separated credentials (`DATABASE_URL` admin-only + `QUARANTINE_/SAFETY_EVENTS_/SUPPRESSION_DATABASE_URL`) and explicit "do not collapse / do not reuse" warnings; `ANTHROPIC_API_KEY` removed from `api` and `retriever` `.env.example` and replaced with CLI-only forbidden notes (distiller was already compliant — original "all three" finding corrected); `RETRIEVER_ENTRYPOINT` fixed to `../retriever/retriever.py` with a container-colocation caveat; `api/README.md` gained a credential-isolation deployment table + corrected stale Claude/SDK and retriever-path wording. No safety module, migration, or policy changed. tsc 0; 7 suites / 84 tests green. *(Working set; link the commit when committed.)*

### S1. Character-bible crisis example contradicts the firebreak principle
- **Source:** STEP 4A (`docs/safety-boundary.md` §8), 2026-05-16.
- Original: `voice/character-bible.md`'s crisis paired-example carried a reflective/companion fork (*"stay quietly with you"*) and a hardcoded resource number, contradicting §8's no-companionship rule and the single-source principle.
- **Closed by:** 4B-H hardening pass (blocker B4), 2026-05-19 — surfaced by the post-4B voice-safety audit, which found the earlier "Resolved (S1)" note in `safety-boundary.md` §8 was *not* reflected in the bible text. The bible crisis block and the "When the user is in crisis" section were rewritten to restate **no** crisis copy and defer wholly to §8; the §8 changelog note was corrected to match reality. *(Working set; link the commit when 4B-H is committed.)*

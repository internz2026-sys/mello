# mellō — Backend Reconciliation Audit

> Auditor reading parallel agent output against the canonical voice/taxonomy specs.
> Date: 2026-05-16
> Scope: `backend/migrations/`, `retriever/`, `api/`, `distiller/distiller.py`
> Canon: `voice/memory-taxonomy.md` v0.2, `voice/character-bible.md` v0.2, `README.md`, `CLAUDE.md`

Severity legend: **blocker** (breaks data integrity or product promise), **high** (silent mismatch that will rot quickly), **med** (drift that wastes time later), **low** (cosmetic / docs).

---

## A. Memory `kind` enum consistency

Canon (`voice/memory-taxonomy.md:22-44`):
`identity, pattern, value, relationship, fear, hope, wound, gladness, commitment`. `spiritual` was removed. Precedence: `wound > pattern > fear > commitment > value > relationship > hope > gladness > identity`.

### Findings

1. **blocker — Postgres enum is stale** (carries `spiritual`, missing `gladness`).
   - **File:** `backend/migrations/0005_memories.sql:10-12`
   - **Spec:** kind ∈ {identity, pattern, value, relationship, fear, hope, wound, **gladness**, commitment}
   - **Code:**
     ```sql
     create type public.memory_kind as enum (
       'identity','pattern','value','relationship','fear','hope','wound','commitment','spiritual'
     );
     ```
   - **Recommended fix:** Drop `'spiritual'`, add `'gladness'`. Because this is an enum type, the safe forward path is a paired migration (`alter type ... add value 'gladness'`; then a data migration that maps any existing `spiritual` rows to a real `kind` + non-empty `spiritual_themes[]`; then `alter type ... rename ...` flow or drop-and-recreate). Cannot be a single `alter type ... drop value`, which Postgres does not support.

2. **blocker — API Zod `MemoryKind` enum is stale** (same drift as schema).
   - **File:** `api/src/schemas/vocab.ts:6-16`
   - **Code:** includes `'spiritual'`, missing `'gladness'`. Comment also says it mirrors taxonomy v0.1, not v0.2.
   - **Recommended fix:** Update to v0.2 list and bump the comment header (`v0.1` → `v0.2`).

3. **high — Distiller prompt is already aligned** (acknowledged in-flight).
   - **File:** `distiller/distiller.py:169-170`
   - **Status:** Already lists `identity, pattern, value, relationship, fear, hope, wound, gladness, commitment` and the correct precedence string. No `spiritual` kind in the prompt. **Distiller agent's parallel fix appears to have landed.** No further action needed here, but the schema and API still need to catch up.

4. **med — Retriever payload accepts any kind opaquely.**
   - **File:** `retriever/seeder.py:50` (`"kind": ""` default) and `retriever/retriever.py:249` (just prints `pl.get('kind','?')`).
   - The retriever does not validate the value, so it will silently absorb whatever the distiller writes. Once the schema/API are fixed, the retriever needs no code change, but it also will not detect drift.
   - **Recommended fix:** Optional — add a debug-mode assertion that `kind` is in the v0.2 list when seeding.

5. **low — README of `backend/migrations/` claims "enums mirror voice/memory-taxonomy.md exactly".**
   - **File:** `backend/migrations/README.md:92-94`
   - **Mismatch:** Claim is currently false (see A.1).
   - **Recommended fix:** Reword once A.1 lands; until then the README is misleading.

---

## B. Memory `stability` enum

Canon (`voice/memory-taxonomy.md:54-62`): `stable, evolving, volatile`.

### Findings

- **Postgres:** `backend/migrations/0005_memories.sql:14` — `enum ('stable','evolving','volatile')` ✓
- **API Zod:** `api/src/schemas/vocab.ts:19` — `z.enum(['stable', 'evolving', 'volatile'])` ✓
- **Retriever:** `retriever/seeder.py:51` defaults to `"evolving"`; payload passes through unvalidated. ✓
- **Distiller:** `distiller/distiller.py:171, 203` — values appear in prompt. ✓

No mismatches.

---

## C. Memory `sensitivity` enum + sealed default

Canon: `normal, tender, sealed`. Retrieval default excludes `sealed`; explicit invocation only. The user owns this and can only ratchet up (normal → tender → sealed), never down.

### Findings

1. **OK — Postgres:** `backend/migrations/0005_memories.sql:15` — `('normal','tender','sealed')` ✓; partial index `memories_user_unsealed_idx` (line 62) and view `memories_retrievable` (line 98) enforce the cheap-exclude default. ✓

2. **OK — API Zod:** `api/src/schemas/vocab.ts:22` — values match. ✓

3. **OK — API `?include_sealed=false` query parameter, default false.**
   - **File:** `api/src/schemas/memory.schema.ts:30` — `include_sealed: z.coerce.boolean().default(false)` ✓
   - **File:** `api/src/schemas/retrieval.schema.ts:7` — same default. ✓
   - **File:** `api/src/memory/memory.controller.ts:13-15` — controller comment correctly describes the policy. ✓

4. **OK — Retriever excludes sealed by default.**
   - **File:** `retriever/retriever.py:130-145` — `build_filter` adds `sensitivity = sealed` to `must_not` unless `include_sealed=True`. ✓ Also documented in `retriever/README.md:91-95`.

5. **unspecified — no schema/code enforces "user can promote sensitivity but never demote".**
   - The taxonomy (lines 76-103) says the user can only ratchet up. Nothing in the schema or API restricts a PATCH from sealed → tender. There is no PATCH endpoint at all yet on `/memories/:id`, so this is a forward-looking concern, not a current violation.
   - **Recommended fix:** Note as a TODO for whoever wires `PATCH /memories/:id`.

---

## D. Vocabulary cardinality (max 3 emotions, max 4 themes) + retriever diversity

Canon: emotions ≤ 3 per memory; themes ≤ 4 per memory; retriever caps each theme at 2 results.

### Findings

1. **OK — Postgres CHECK constraints.**
   - **File:** `backend/migrations/0005_memories.sql:50-51`
     ```sql
     constraint memories_emotions_max_3 check (cardinality(emotions) <= 3),
     constraint memories_themes_max_4   check (cardinality(themes)   <= 4)
     ```

2. **OK — API memory schema enforces it.**
   - **File:** `api/src/schemas/memory.schema.ts:13-14` — `emotions: ...max(3)`, `themes: ...max(4)`.

3. **med — `journal_entries.mood_words` cap drifts.**
   - **File (DB):** `backend/migrations/0004_episodic.sql:17` — `text[] not null default '{}'`, **no cap.**
   - **File (API):** `api/src/schemas/reflection.schema.ts:9, 19` — `mood_words: z.array(Emotion).max(6)` (6, not 3).
   - **Canon:** taxonomy line 125 says "max 3 emotions per memory." It does not impose a number on `journal_entries.mood_words[]`, but pegging the slider tag to 6 then capping `memories.emotions` to 3 means the distiller has to drop half the mood words. That is fine, but the asymmetry is undocumented.
   - **Recommended fix:** Either (a) lower `mood_words.max(6) → max(3)` and add a DB CHECK constraint to match memories, or (b) leave at 6 and add a one-line comment in `memory-taxonomy.md` clarifying that journal-entry mood tags ≠ memory emotions.

4. **OK — Retriever theme cap @ 2.**
   - **File:** `retriever/retriever.py:60` — `MAX_PER_THEME = 2`. Applied in `diversity_filter` at line 117-123. ✓

5. **unspecified — no schema enforces `spiritual_themes[]` cardinality.**
   - **File (DB):** `backend/migrations/0005_memories.sql:33` — no cap.
   - **File (API):** `api/src/schemas/memory.schema.ts:16` — `max(6)`.
   - **Canon:** memory-taxonomy.md does not state a cap on `spiritual_themes[]`.
   - **Recommended fix:** Either codify a cap in the taxonomy (a paragraph) or remove the API `max(6)` so the layers don't fork.

---

## E. Importance formula consistency (v0.2)

Canon (`voice/memory-taxonomy.md:180-193`):
```
importance =
  0.30 * emotional_intensity
+ 0.25 * recurrence_signal
+ 0.20 * self_reference_density
+ 0.10 * relational_density
+ 0.05 * named_values_or_calling
+ 0.05 * future_orientation
+ 0.05 * present_attention
```

### Findings

1. **unspecified — formula is not implemented anywhere in backend code.**
   - Grep across `backend/`, `retriever/`, `api/`, `distiller/` for `relational_density`, `present_attention`, `named_values_or_calling`, `emotional_intensity`, `recurrence_signal`, `self_reference_density`, `future_orientation` returns **only the taxonomy doc itself** (`voice/memory-taxonomy.md:182-189`). No code references.
   - **Status:** Formula lives only in docs. The distiller reads "importance: 0.0-1.0" from the prompt template (`distiller.py:212`) and trusts Claude to compute a number freehand — there is no programmatic decomposition into the 7 weighted signals. This is acceptable for Phase 0 (LLM-judged importance), but it means the v0.2 rebalance has **no enforcement surface**.
   - **Recommended fix:** Two options. (1) Bake the decomposition into the distiller's system prompt so Claude returns the seven sub-scores and the code computes the weighted sum (deterministic, debuggable). (2) Leave it as LLM-judged but reference the formula explicitly in the distiller prompt so the model can self-discipline. Either way, add a `vocab_version`-style `importance_formula_version` tag to memories written under v0.2 so we can re-score later.

2. **low — `importance` field is widely present and numerically bounded** in schema (`0005_memories.sql:35`), API (`memory.schema.ts:17`), retriever payload (`seeder.py:60`), and retrieval rank (`retriever.py:55`). No inconsistency at the storage layer, just no formula implementation.

---

## F. Retrieval ranking formula

Canon (`voice/memory-taxonomy.md:206-218`):
```
score = 0.5 * cosine_similarity + 0.3 * importance + 0.2 * recency_signal
```
Then: drop near-duplicates (sim > 0.9 to higher-scored sibling), cap each theme at 2, final cut top 6–8.

### Findings

1. **OK — `retriever.py` implements this exactly.**
   - **File:** `retriever/retriever.py:53-56` — `W_SIM=0.5, W_IMP=0.3, W_REC=0.2`.
   - **File:** `retriever/retriever.py:58-61` — `NEAR_DUP_THRESHOLD=0.9, MAX_PER_THEME=2, FINAL_K=8`.
   - **File:** `retriever/retriever.py:64-76` — `recency_signal = 1 / (1 + days_since/30)` (a defensible, taxonomy-silent specific shape; the doc does not pin the recency function — see F.2).
   - **File:** `retriever/retriever.py:88-89` — composite scoring matches.
   - **File:** `retriever/retriever.py:92-127` — diversity pass implements both rules.

2. **unspecified — `recency_signal` exact shape is not pinned in the taxonomy.**
   - The doc names the term and gives `stable` no decay, `evolving` ~6mo half-life, `volatile` ~30-day half-life (lines 200-202), but the retriever uses a single `1/(1+days/30)` function for all kinds, ignoring `stability`. The retriever README acknowledges this gap (`retriever/README.md:117-118`). Flag as a known forward item, not a current bug.

3. **med — final-k discrepancy between layers.**
   - Retriever caps at `FINAL_K=8` (`retriever.py:60`, also clamped at `retriever.py:231` with `min(args.k, FINAL_K)`).
   - API `RetrieveInputSchema` allows `top_k.max(20)` (`api/src/schemas/retrieval.schema.ts:6`). A caller asking for `top_k=15` will pass Zod validation, but the retriever subprocess (if it were invoked) would silently return at most 8.
   - **Recommended fix:** Either lower API `top_k.max` to 8, or raise retriever `FINAL_K` to 20. The taxonomy says "top 6–8"; aligning at 8 is the canonical move.

4. **blocker — API → retriever subprocess wiring will never succeed.**
   - **File:** `api/src/retrieval/retrieval.service.ts:20, 30` — defaults to `../retriever/retrieve.py` and invokes with arg `--stdin`.
   - **File (actual):** `retriever/retriever.py` (note the trailing **`er`**) with argparse flags `--user_id`, `--query`, `--include-sealed`, `--k`, `--format`. There is **no `--stdin` mode** and no file at `retrieve.py`.
   - **Effect:** Every `/retrieve` call will spawn-fail or `argparse`-fail and the service's `fallback()` will return `{ results: [] }`. The API's only "real" non-stub endpoint is silently broken.
   - **Recommended fix:** Either (a) rename `retriever.py → retrieve.py` (and fix the README mirror image at `retriever/README.md`) and add an `--stdin` mode that reads `{user_id, query, top_k, include_sealed}` JSON from stdin and emits the `RetrieveResponse` shape on stdout, or (b) change the API default `RETRIEVER_ENTRYPOINT` to `../retriever/retriever.py` and rewrite `retrieval.service.ts` to invoke with the existing CLI flags + parse the `--format json` output (which currently is a list of memories, not the `RetrieveResponse` envelope — see F.5).

5. **high — API `RetrieveResponse` envelope ≠ retriever JSON output.**
   - **File (API expected):** `api/src/schemas/retrieval.schema.ts:19-23` — `{ query, results: RetrievedMemory[], retrieved_at }` where each result extends `MemorySchema` with `score, cosine_similarity?`.
   - **File (retriever produces):** `retriever/retriever.py:174-184, 234-235` — emits a bare JSON list of `{id, score, components, payload}` objects. No `query`, no `retrieved_at`, payload is flat (not Memory-shaped — e.g., no `id, user_id, vocab_version`).
   - **Effect:** Even after fixing F.4, `JSON.parse(out) as RetrieveResponse` will succeed at runtime but be a lie — the response will not match the schema.
   - **Recommended fix:** Add a `--format envelope` flag to `retriever.py` that emits `{ query, results: [...full memory + score], retrieved_at }`, or add a TypeScript adapter in `retrieval.service.ts` that maps the current bare-list output to `RetrieveResponse`.

---

## G. No streaks

Canon: `README.md:58` "No streaks. No re-engagement spam. Max 1 notification/day." `CLAUDE.md:43` "Don't suggest hustle-culture features (streaks, gamification, leaderboards)."

### Findings

1. **OK — No `streaks` table.** Grep across `backend/migrations/*.sql` returns zero matches for `streak`. Explicit refusal documented at `backend/migrations/0007_practice.sql:4-8` and `backend/migrations/README.md:83-85`.

2. **OK — No streak fields.** `goals`, `habits`, `habit_observations` (`0007_practice.sql:10-89`) carry only `cadence text`, `present boolean`, `note text`, `paused_at`, `completed_at`. No counters, no consecutive-day tracking.

3. **OK — No streak endpoints.** No NestJS controller exposes anything streak-shaped. No streak in `api/src/schemas/`. No streak in the retriever payload.

4. **OK — `notification_window.max_per_day` is defaulted to 1.**
   - **File:** `backend/migrations/0002_identity.sql:31` — `'max_per_day', 1` in the default jsonb.
   - **med (related but separate):** API Zod allows up to 3 (`api/src/schemas/profiles.schema.ts:6` — `max_per_day: z.number().int().min(0).max(3)`). The product promise is "max 1/day" (`README.md:58`). The schema lets a user (or a UI bug) raise it to 3 silently.
   - **Recommended fix:** Lower API `max_per_day.max(3) → max(1)` to match the README commitment, or update the README to acknowledge that 1 is a default, not a cap.

---

## H. `qdrant_point_id` link

Canon (`voice/memory-taxonomy.md` does not explicitly name `qdrant_point_id` but treats Qdrant as the linked store; README in retriever calls it out).

### Findings

1. **OK — Schema carries it.**
   - **File:** `backend/migrations/0005_memories.sql:39` — `qdrant_point_id text unique`.

2. **high — Seeder ID scheme is incompatible with the schema's intent.**
   - **File (seeder):** `retriever/seeder.py:66-70` — `stable_point_id(user_id, summary)` returns a **UUID5-like string** derived from `sha1(user_id::summary)`. Note: not a real UUID5 (no namespace, just first 32 hex of sha1); it parses through `uuid.UUID(...)` because any 32-hex string does, but it is not a v5 UUID.
   - **File (schema):** `memories.qdrant_point_id text unique` — typed `text`, so any string works.
   - **The risk:** Postgres `memories` is written by the distiller pipeline; Qdrant points are written by the seeder using `(user_id, summary)`. There is **no shared identity provider** — the distiller and seeder must independently produce the same `qdrant_point_id` for the same memory or the link breaks. Currently the distiller does **not** set `qdrant_point_id` at all (it is not in the `Memory` dataclass — `distiller/distiller.py:69-83`), and Postgres rows would be inserted by some yet-unwritten ingester with `qdrant_point_id = NULL`.
   - **Effect:** Today the link is conceptual, not concrete. The retriever returns memories from Qdrant payload only; it never joins back to Postgres. The API's eventual `/memories` list also never joins. So "linked" memories are not linked.
   - **Recommended fix:** Decide ownership: either the distiller computes the deterministic point id and writes it to both stores, or the seeder computes it and the writer-to-Postgres updates `memories.qdrant_point_id` after upsert. Document the algorithm in `memory-taxonomy.md` ("`qdrant_point_id = uuid5(NS_MELLO, user_id || summary_hash)`") and use a proper UUID5 with a fixed namespace.

3. **med — Seeder strips no Postgres-only fields.**
   - **File:** `retriever/seeder.py:147-176` — uploads everything in the input JSON to Qdrant payload. If/when the distiller starts emitting `id` (Postgres PK) and `qdrant_point_id`, the seeder will silently duplicate them in payload, which is harmless but redundant.

---

## I. RLS posture spot-check

Backend-1 README (`backend/migrations/README.md:67-79`) claims RLS on every user-owned table with `auth.uid()` policies.

### Findings (spot-checked 3 migrations)

1. **OK — `0002_identity.sql`:**
   - Lines 44-45: `alter table public.users enable row level security;` and same for `profiles`.
   - Lines 48-64: `users_select / users_update / users_delete / users_insert` policies, all `id = auth.uid()`.
   - Lines 67-81: profiles parallel set with `user_id = auth.uid()`.

2. **OK — `0005_memories.sql`:**
   - Line 77: RLS enabled.
   - Lines 79-93: select/insert/update/delete policies, all `user_id = auth.uid()`.

3. **OK — `0010_safety_events.sql`:**
   - Line 39: RLS enabled.
   - Lines 44-50: select + insert policies with `user_id = auth.uid()`.
   - Lines 52-53: intentionally **no** update/delete user policy (append-only from user POV; service-role writes bypass RLS). The README documents this explicitly.

4. **OK — `0011_subscriptions.sql`:**
   - Line 43: RLS enabled.
   - Lines 47-49: select-only policy. No insert/update/delete for end users (writes are Stripe-webhook → service-role). Documented at line 51 and README line 75.

5. **OK — `0001_extensions.sql`** correctly creates no tables (only extensions + the `auth.uid()` shim), so 0 RLS statements is expected.

No mismatches with the README claim.

---

## J. Crisis-frame plumbing

Canon (`voice/character-bible.md:208-214, 250-258`): The crisis path is **scripted**, **not generated**. mellō breaks second-person voice only briefly, only at crisis, and only in pre-written copy. "Never improvise around suicide, self-harm, abuse, severe distress."

### Findings

1. **OK — `SafetyModule` exists** (`api/src/safety/safety.module.ts`), wired into `app.module.ts:11, 22`.

2. **OK — No AI generation in the safety path.**
   - **File:** `api/src/safety/safety.service.ts:14-19` — `classify()` is a hardcoded `return { signal: null }`. No LLM client imported. No prompt assembled. No streaming.
   - **File:** `api/src/safety/safety.controller.ts:14-21` — single `POST /safety/classify` endpoint, returns the service result directly.

3. **OK — Schema constrains the signal to an enum.**
   - **File:** `api/src/schemas/safety.schema.ts:13-19` — `SafetySignal = 'self_harm' | 'harm_to_other' | 'abuse_disclosure' | 'acute_crisis'`. Bounded; no free-text.

4. **med — Crisis copy is not stored anywhere in the API codebase.**
   - The character bible's crisis script (`character-bible.md:210-213`: *"I'm reading carefully. Before anything else — are you safe right now?..."*) lives only in markdown. There is no `safety/crisis-copy.ts` or similar string-constants file the API would route to when `signal != null`.
   - **Effect:** When the real classifier wires up in Phase 2, whoever implements it could be tempted to ask Claude for the response — which the bible explicitly forbids.
   - **Recommended fix:** Add a `safety/crisis-copy.ts` (or equivalent JSON in the migrations / seed) with the scripted strings keyed by `SafetySignal`, and have `safety.service.ts` document that the crisis branch must return these verbatim, never re-generated. Stub fine for Phase 0; the structural commitment matters.

5. **med — `safety_events` is in the schema but the API never writes to it.**
   - **File:** `backend/migrations/0010_safety_events.sql` — table exists with full columns (signal_type, response_taken, resources_shown, escalated_to_human, etc.).
   - **File:** API has no `SafetyEventsService` / `SafetyEventsController`. The audit table is wired in the DB only.
   - **Recommended fix:** When safety.service is real, every non-null classification must write a `safety_events` row. Not a current bug (Phase 0 stub) but a forward-looking gap; flag for the Phase 2 ticket.

---

## K. Brand rename completeness (mellōn → mellō)

### Findings

1. **OK — Backend deliverables are clean of `mellōn`.**
   - Grep for the macron-O form `mellōn` across `backend/migrations/`, `retriever/`, `api/`, `distiller/`: **zero matches.** All four directories use either `mellō` (in prose/docs) or `mello` (in code identifiers).

2. **low — Lingering `mellōn` references outside backend scope.**
   - **Files:** `audits/voice-audit.md` (24+ occurrences), `audits/architecture-audit.md` (7+ occurrences). Both are pre-rename artifacts.
   - **Note:** These are out of scope per the task brief (audits/ is its own agent's territory), but the user should know the older audits still refer to the prior brand.
   - **Recommended fix:** Out of scope for this reconciliation; flag for an audits-agent pass.

3. **low — `mello` (no macron) as an ASCII slug is everywhere and intentional.**
   - Container names (`mello-api`, `mello-qdrant`, `mello-redis`, `mello-pg`), npm package names (`mello-api`, `mello-web`, `mello-mobile`, `@mello/e2e`), env var prefixes (`MELLO_NOTICER_MODEL`, `MELLO_DISTILLER_MODEL`), Qdrant collection (`mello_memories`), filenames (`project_mello.md`), bundle identifiers (`co.melloapp.mobile`).
   - **Status:** RESOLVED 2026-05-22 — the ASCII slug was renamed to `mello` across all technical identifiers (containers, npm names, env-var prefixes, Qdrant collection, filenames, bundle IDs) per explicit product decision.
   - **Note:** ASCII-safe slugs remain appropriate for these contexts (Docker, npm, Java reverse-domain); only the slug spelling changed.

---

## L. Other reconciliation findings (not in the A–K checklist)

Reported because they are silent mismatches between agents that will bite.

1. **blocker — `hope` appears in both `MemoryKind` and `Emotion` enums in the API.**
   - **File:** `api/src/schemas/vocab.ts:12` (`MemoryKind` includes `'hope'`) **and** `api/src/schemas/vocab.ts:33` (`Emotion` includes `'hope'`).
   - **Canon:** `voice/memory-taxonomy.md:172` (Dedup rule) — *"`hope` is a `kind`, not an emotion or spiritual theme. ... This keeps retrieval honest — the same concept can't fire in three fields and inflate its own score."*
   - **Effect:** A memory could land with `kind: 'hope'` AND `emotions: ['hope']` — exactly the score-inflation bug the taxonomy forbids.
   - **Recommended fix:** Remove `'hope'` from the `Emotion` enum (line 33). Cross-check `distiller/distiller.py:104` — it already follows the canon (no `hope` in emotion vocab); the API schema is the lone violator.

2. **high — API `chat_messages` schema diverges from DB column names.**
   - **File (DB):** `backend/migrations/0004_episodic.sql:55-63` — columns `session_id uuid`, `content text`, role enum includes `'system'`.
   - **File (API):** `api/src/schemas/reflection.schema.ts:36-43` — fields `thread_id`, `body`, role enum is `['user','assistant']` only (no `'system'`).
   - **Effect:** When the API is wired to the DB, every chat-message create/list will require column-name aliasing and the API will silently drop system-role messages.
   - **Recommended fix:** Pick one. The product brief speaks of "sessions" (taxonomy) and the bible speaks of "turns" — using DB names (`session_id`, `content`, allow `'system'`) in the API is the safer call.

3. **high — API `JournalEntry` schema diverges from DB.**
   - **File (DB):** `backend/migrations/0004_episodic.sql:10-20` — columns `kind` (enum: text/voice/prompted/quick/dream/letter_to_self), `content_text`, `content_audio_url`, `raw_mood int (1..10)`, `mood_words text[]`, `processed_at`. No `body`, no `spiritual_layer`, no `source`.
   - **File (API):** `api/src/schemas/reflection.schema.ts:5-13` — fields `body`, `mood_words`, `spiritual_layer`, `source` (web/mobile/voice/import), no `kind`, no `raw_mood`, no `audio_url`.
   - **Effect:** Same as L.2 — the API speaks a different language than the DB. `source` ≈ DB `kind` partially but not 1:1 (DB enum has product-meaningful kinds like `dream`, `letter_to_self`, `prompted`; API enum is platform-source).
   - **Recommended fix:** Reconcile the two. The DB shape is richer and matches the product (voice/onboarding/letters); the API should follow it.

4. **med — `Theme` Zod schema is a free string, not an enum.**
   - **File:** `api/src/schemas/vocab.ts:39-42` — comment justifies this as forward-compat for vocab versions.
   - **Canon:** taxonomy has ~50 frozen theme values (lines 132-160). A free string lets clients post arbitrary themes; the DB does not check theme membership either (no enum/CHECK; the array is just `text[]`).
   - **Effect:** Vocabulary drift will happen silently. The retriever's diversity pass caps by theme name, so the cap becomes useless once free strings hit the index.
   - **Recommended fix:** Either codify the theme list as a Zod enum (versioned via `vocab_version`) or write a runtime validator in the API/distiller. The comment-only deferral is a footgun.

5. **med — Retriever payload has no payload index for `kind` set up consistently with API filters.**
   - **File:** `retriever/seeder.py:85-95` indexes `user_id`, `sensitivity`, `themes`, `kind` ✓ — but does NOT index `emotions` or `last_reinforced_at`. The API memory schema allows filtering by `emotion` and `kind` (`api/src/schemas/memory.schema.ts:27-29`); the eventual DB query path is fine, but the retriever cannot filter on `emotion` payloads efficiently.
   - **Recommended fix:** Either add emotion index in `seeder.py`, or document that emotion filtering on the retrieval path is done post-fetch in code.

6. **low — Subscription tier names (`threshold`, `companion`, `sanctuary`) are not echoed anywhere in the API or voice docs.**
   - **File:** `backend/migrations/0011_subscriptions.sql:13` — enum committed.
   - No matching Zod schema, no controller. The names are product-meaningful (threshold = entry tier, sanctuary = full) and worth keeping consistent.
   - **Recommended fix:** Add a Zod `SubscriptionTier` and a `GET /subscription` endpoint stub when the time comes.

7. **med — Memory schema `summary` length cap differs between layers.**
   - **DB (`0005_memories.sql:27`):** `char_length(summary) <= 1200`.
   - **API (`memory.schema.ts:11`):** `z.string().max(800)`.
   - **Canon (`memory-taxonomy.md:225`):** "summaries longer than 3 sentences" forbidden — a soft constraint, no character count.
   - **Effect:** A 900-char summary from the distiller passes the DB CHECK but fails Zod validation when read through the API.
   - **Recommended fix:** Align (1200 in both, or 800 in both). 1200 matches the "soft length cap as safety net" intent the DB comment describes.

---

## Rollup

### Count by severity (across A–L)

- **Blocker:** 4 — A.1 (Postgres kind enum), A.2 (API kind enum), F.4 (API↔retriever wiring will always fail), L.1 (`hope` duplicated as kind and emotion).
- **High:** 5 — A.3 (distiller status: fixed but flag), F.5 (response envelope shape), H.2 (qdrant_point_id has no shared id provider), L.2 (chat_messages shape divergence), L.3 (journal_entries shape divergence).
- **Med:** 9 — A.4, D.3 (mood_words cap drift), D.5 (spiritual_themes cap unspecified), F.3 (top_k cap drift), G.4 (max_per_day allows 3), H.3, J.4 (no crisis-copy file), J.5 (no safety_events writer), L.4 (Theme free-string), L.5, L.7 (summary length drift).
- **Low:** 4 — A.5 (README claim outdated), E.2, K.2 (audits/ still says mellōn), K.3 (ASCII slug undecided), L.6 (subscription tiers not in API).
- **Unspecified:** 4 — C.5 (no sensitivity-promotion enforcement), D.5 (spiritual_themes cap), E.1 (formula not implemented), F.2 (recency_signal shape), K.3 (ASCII slug intent).

### Top 3 to fix before wiring API → DB

1. **L.1 — Remove `'hope'` from the `Emotion` enum** (`api/src/schemas/vocab.ts:33`). This is a one-line fix and prevents the exact double-counting the taxonomy was rebalanced to avoid. Lowest cost, highest taxonomy-trust payoff.

2. **A.1 + A.2 — Synchronise `memory_kind` to v0.2** in both Postgres (`0005_memories.sql:10-12`) and Zod (`vocab.ts:6-16`): drop `spiritual`, add `gladness`. Until this lands, *any* row the (correctly aligned) distiller writes with `kind = 'gladness'` will be rejected by both the DB enum and the API validator. Treat this as a coordinated single PR — schema migration + API schema bump + retriever does not need a change (payload is unvalidated text).

3. **L.2 + L.3 — Align API `JournalEntry` / `ChatMessage` schemas with the actual DB columns** (`api/src/schemas/reflection.schema.ts` vs `backend/migrations/0004_episodic.sql`). These will be the first endpoints wired and the divergence is large enough that "just write SQL" will not paper over it. Decide column names now (recommend DB names: `kind`, `content_text`, `session_id`) and update both Zod and the controllers' field maps before the first persistence PR.

### Honorable mentions (fix soon, not blocking)

- **F.4 — API retrieval subprocess wiring** (`retrieval.service.ts:20, 30`). Filename, flag set, and output envelope all wrong. The endpoint cannot return real data today. If you care about end-to-end smoke tests before DB is wired, this is the actual #1.
- **H.2 — `qdrant_point_id` link is conceptual, not concrete.** Decide ownership of the deterministic id before any second writer touches the system.
- **G.4 — Tighten `max_per_day` to 1** in the API to match the README promise.

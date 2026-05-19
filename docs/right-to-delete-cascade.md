# A2 — Right-to-Delete Cascade (Design / Spec Pass)

**Status:** design + specification only. **No implementation in this pass.**
This document is safe to write while 4D is with counsel: it specifies a
*mechanism* and marks every retention/audit decision as policy-gated by
4D, inventing none of them.

**Blocker:** A2 (pre-launch). Related: `docs/safety-boundary.md` §10
(retention) / §11 (human-review), `docs/legal-clinical-review/`,
`docs/follow-ups.md`.

## 1. Scope & non-goals

**In scope (this pass):** data inventory, deletion graph, orchestration
model, Qdrant deletion, object-storage policy, deletion audit trail,
backup policy, failure/recovery semantics.

**Explicitly NOT in this pass:** writing migrations, jobs, or code;
choosing retention durations; deciding whether crisis quarantine or
`safety_events` survive a user delete. Those last two are **locked behind
4D** and appear here only as *parameters*, never as decisions.

**Must not invalidate 4B–4D:** nothing here changes crisis bridge copy,
classifier behaviour, abuse-disclosure handling, retention policy,
human-review policy, low-confidence handling, or region defaults. The
core invariant holds: *crisis material is acute-state material, not
identity truth* — and deletion must not become a backdoor that reads or
relocates it.

## 2. Principles

1. **Delete means unrecoverable erasure**, not a soft `deleted_at` flag,
   once the grace/legal-hold window (4D) passes.
2. **Default-restrictive:** absent a 4D ruling, the safe default is
   *erase*. 4D may *extend* retention (duty-of-evidence) deliberately; it
   never *discovers* that data was being kept.
3. **The cascade is multi-store and not atomic.** Postgres, Qdrant,
   object storage, and backups cannot be deleted in one transaction. The
   design must be a resumable, idempotent, verifiable orchestration — not
   a single `DELETE`.
4. **Isolation survives deletion.** The quarantine store is reached only
   by its dedicated credential; the delete path uses that same isolated
   credential and never a broad one. Deletion does not create a new read
   path into crisis data.
5. **Proof of erasure is itself minimal.** The record that "user X was
   deleted" must not re-introduce identifying or crisis content.

## 3. Data inventory

### 3a. Postgres — `public` schema (cascade root = `public.users`)

Almost every table FKs `user_id → public.users(id) ON DELETE CASCADE`. A
hard delete of the `users` row erases these automatically:

| Table | Owner key | Auto-cascade on `users` delete? | Notes |
|---|---|---|---|
| `profiles` | user_id (unique) | yes | |
| `reflection_profiles` | user_id | yes | |
| `journal_entries` | user_id | yes | primary content |
| `chat_messages` | user_id | yes | |
| `memories` | user_id | yes | distilled semantic memory (Postgres side) |
| `future_selves` | user_id | yes | |
| `future_letters` | user_id | yes | |
| `goals` / `habits` / `habit_observations` | user_id | yes | habit_observations also via habit FK |
| `people` | user_id | yes | relationship records |
| `reviews` | user_id | yes | |
| `subscriptions` | user_id | yes | confirm billing-provider mirror (Stripe etc.) is a separate deletion target — external system, not Postgres |
| `safety_events` | user_id → users **ON DELETE CASCADE** | **structurally yes — but POLICY-GATED (4D)** | audit log; see §3c |

### 3b. Postgres — `quarantine` schema (does NOT auto-cascade)

`quarantine.crisis_entries` has `user_id` with **intentionally no FK** to
`public.users` ("quarantine must not be join-reachable from public").
Therefore a `users` delete does **not** touch it. It carries its own
`purge_after timestamptz`. Deletion here is a **separate, explicit,
isolated job**, and whether/when it runs is **OPEN — 4D**.

### 3c. The two policy-gated arms (do not decide here)

- **`quarantine.crisis_entries`** — restrictive default: purge on the
  same erasure event as everything else. 4D may *extend* (duty-of-
  evidence) or *forbid retention entirely*. Spec treats the retention
  horizon as a single parameter `QUARANTINE_RETENTION` ∈ {erase-now,
  retain-until(date), forbid-store} set by 4D.
- **`public.safety_events`** — currently cascades on user delete. But it
  is the **audit log**, and §11 keeps it closed; whether the audit must
  *survive* a user deletion (anonymized) for duty-of-evidence is **OPEN —
  4D**. Spec must NOT assume cascade is final: provide a switchable
  `SAFETY_EVENTS_ON_DELETE` ∈ {cascade-erase, detach-and-retain-
  anonymized}. If 4D chooses retain, the FK cascade must be replaced with
  a deliberate detach (null/hash the `user_id`, drop `source_id`), never
  left to silently erase the audit, and never left to silently retain
  identifiable data.

### 3d. Out-of-Postgres stores

| Store | What | Deleted by Postgres cascade? | Deletion mechanism needed |
|---|---|---|---|
| **Qdrant** | distilled-memory embeddings, collection base `mello_memories`, **provider+dim-scoped → multiple physical collections** | **No** | explicit delete-by-payload-filter on `user_id`, across *every* provider/dim collection variant (§6) |
| **Object storage** | none in the codebase today (verified) | n/a | forward-looking policy only (§7) — must exist before any feature adds blobs (audio, exports, attachments, rendered seed letters) |
| **External billing** | subscription mirror at payment provider | No | provider-side deletion/anonymization API call; out-of-scope to implement here, in-scope to enumerate |
| **Backups / WAL / snapshots** | DB + Qdrant backups | No | retention-horizon + crypto-shred policy (§9) |
| **Operational logs** | app logs | No | crisis text already provably absent (4B-H/B3); deletion policy still must cover ordinary PII in logs |

## 4. Deletion graph

```
delete request (user-initiated or admin/legal)
   │
   ▼
[grace / legal-hold window]  ── 4D parameter; default = minimal
   │
   ▼
ORCHESTRATOR (resumable saga; one row in deletion_jobs)
   ├─ step P  Postgres public cascade  (DELETE users → cascades 3a)
   ├─ step S  safety_events            (per SAFETY_EVENTS_ON_DELETE — 4D)
   ├─ step Q  quarantine.crisis_entries(per QUARANTINE_RETENTION — 4D)
   ├─ step V  Qdrant: delete-by-filter user_id across all collections
   ├─ step O  object storage: delete by user prefix  (no-op today)
   ├─ step X  external billing: provider delete/anonymize
   └─ step B  register backup-shred obligation (horizon, not immediate)
   │
   ▼
VERIFY each step (read-back returns zero) → write minimal erasure receipt
   │
   ▼
job = complete  (or → failure/recovery, §10)
```

Order rationale: P first (removes live reachability fastest). S and Q are
*independent isolated arms* run by their **own dedicated credentials**,
not the orchestrator's broad one. V/O/X are external and each
independently verifiable. B is a registered obligation, not a synchronous
delete.

## 5. Orchestration — queues / jobs

- **One durable job record** (`deletion_jobs`: user_id, requested_at,
  state, per-step status, attempts, last_error, completed_at). This is
  the saga log; it survives process restarts.
- **Idempotent steps.** Every step must be safe to re-run: re-deleting an
  already-deleted row/point/object is a success, not an error. "Done" =
  verification read-back is empty, not "DELETE returned."
- **Async, not request-scoped.** Triggered by a queue/worker (the project
  already runs background workers for distillation); deletion is a
  first-class job type, not an HTTP handler.
- **Backpressure & isolation.** The quarantine step uses
  `QUARANTINE_DATABASE_URL`'s role only; granting it `DELETE` on
  `quarantine.crisis_entries` is the *only* new grant A2 introduces, and
  only if 4D's `QUARANTINE_RETENTION` permits programmatic purge. No
  other credential gains quarantine reach.
- **Single-flight per user.** A user may not have two concurrent deletion
  jobs; re-requests attach to the existing job.

## 6. Qdrant deletion

- Points carry `user_id` in payload. Deletion is **delete-by-filter**
  (`user_id == <id>`), not delete-by-point-id (ids aren't tracked
  Postgres-side).
- The collection name is **provider+dim-scoped** (`collection_name(base,
  provider)`), so multiple physical collections can exist (e.g. after an
  embedding-provider switch — Voyage vs. local nomic). The delete step
  MUST enumerate **all** collections matching the `mello_memories*`
  base, not just the currently-active one, or an old collection silently
  retains vectors.
- **Verification:** after delete, a filtered count by `user_id` across
  every matched collection must return 0. Store the per-collection result
  in the job record.
- **Failure mode:** Qdrant unreachable → step retries with backoff; job
  stays incomplete; never report erasure complete with V unverified.

## 7. Object storage deletion (forward-looking)

No object store exists today (verified — grep hits were documentation
text, not S3/bucket usage). Policy to enforce **before** any feature adds
blobs:

- All user blobs MUST be written under a `user/<user_id>/…` key prefix so
  deletion is a single prefix sweep + verification.
- No blob may be the *only* copy of crisis text (it never is today; this
  preserves that).
- The deletion job's step O becomes a prefix-delete + list-verify;
  until then it is a verified no-op.

## 8. Deletion audit trail (minimal erasure receipt)

A deletion must itself be provable without re-creating a data trail:

- Record: a **non-reversible hash** of the user id (so support can
  confirm "this account was erased" without storing the id), request
  timestamp, completion timestamp, per-store step outcomes
  (cleared/anonymized/retained-by-4D), and the job id.
- **No** name, email, content, risk label, or crisis category in the
  receipt. The receipt proves *that* erasure happened, never *what* was
  erased.
- The receipt's own retention is a 4D question (likely the longest-lived
  record, precisely because it contains nothing sensitive).

## 9. Backup policy

Backups are the genuinely hard part — a deleted row persists in snapshots
until they age out.

- **Default posture:** deletion is *logically* complete when live stores
  (P/S/Q/V/O) verify empty; it is *fully* complete when all backups
  predating the deletion have rotated past the **backup retention
  horizon** (a 4D-bounded number).
- **Crypto-shred option (to evaluate, not decide):** per-user encryption
  envelope so destroying the user's key renders backup copies
  unrecoverable without waiting for rotation. Flag for 4D + infra review;
  do not implement in this pass.
- Backup retention horizon, and whether crypto-shred is required vs.
  rotation-wait is acceptable, is **OPEN — 4D / infra**. Spec exposes it
  as `BACKUP_SHRED_HORIZON`.
- The same horizon logic binds Qdrant snapshots and any future object-
  store versioning.

## 10. Failure & recovery semantics

- **Partial failure is expected and safe.** Steps are independent and
  idempotent; a failed step leaves the job `incomplete`, never silently
  `complete`.
- **Retry with backoff**, capped; after cap → `needs_attention`
  dead-letter state surfaced to an operator queue (no auto-give-up that
  reports success).
- **Reconciliation sweep:** a periodic job re-verifies that no live store
  holds rows/points/objects for any `deletion_jobs` user in a terminal
  state — catches a store that resurrected data (e.g. a delayed write, a
  restored backup).
- **"Erased" is a verified state, never an assumed one.** The user/legal-
  facing status is driven by verification read-backs, not by DELETE
  return codes.
- **Restore-after-delete hazard:** if a backup is restored for unrelated
  reasons, the reconciliation sweep + the registered backup-shred
  obligations must re-apply outstanding deletions. This must be an
  explicit operational runbook item.

## 11. 4D interaction matrix (parameters, not decisions)

| Parameter | Default (restrictive) | 4D may set to | Affects |
|---|---|---|---|
| `QUARANTINE_RETENTION` | erase on deletion event | retain-until(date) \| forbid-store | step Q |
| `SAFETY_EVENTS_ON_DELETE` | cascade-erase | detach-and-retain-anonymized | step S, schema change |
| grace / legal-hold window | minimal | extended for duty-of-evidence | orchestrator entry |
| `BACKUP_SHRED_HORIZON` | shortest defensible | longer \| crypto-shred-required | step B |
| erasure-receipt retention | long (contains nothing sensitive) | as ruled | §8 |

Engineering ships the switches; 4D sets the values. None are set here.

## 12. Open items → `docs/follow-ups.md`

- A2-1: schema change to make `safety_events.user_id` cascade
  *switchable* (FK cascade vs. deliberate detach) — blocked on 4D
  `SAFETY_EVENTS_ON_DELETE`.
- A2-2: add `DELETE` grant to the quarantine role *iff* 4D permits
  programmatic purge — blocked on 4D `QUARANTINE_RETENTION`.
- A2-3: `deletion_jobs` saga table + worker — implementable now
  (mechanism is policy-neutral); gate the S/Q steps behind the 4D
  parameters.
- A2-4: Qdrant multi-collection delete-by-filter + verification helper.
- A2-5: object-storage key-prefix convention enforced before any blob
  feature lands.
- A2-6: backup-shred horizon + crypto-shred evaluation (infra + 4D).
- A2-7: external billing-provider deletion/anonymization enumeration.

These are **specification items**, not committed work. Implementation is a
later explicit task, and the S/Q arms cannot be finalized until 4D
returns.

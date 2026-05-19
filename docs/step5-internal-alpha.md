# STEP 5 — Internal Alpha Environment (Spec)

**Status:** implementation spec. Deploy target **decided: single VPS,
docker-compose** (Postgres + Qdrant + API-with-colocated-Python-retriever
behind an alpha gate). Operates strictly under
`docs/research-evidence-dossier.md` §6 interim constraints. Touches no
crisis policy; the firebreak is shipped unchanged.

## 1. Goal

Get mellō *running* for a tiny, invite-only, adults-only internal alpha —
as fast as is safe — without becoming a public product and without
unlocking any 4D-gated decision.

## 2. Hard constraints (inherited, non-negotiable)

From 4D-R §6: internal/invite-only · adults only, no minors · no paid ·
no therapy/crisis-service claims · no ad pixels · no third-party
analytics on journal/crisis content · crisis text never in
memory/embeddings/retrieval/future-self · disclaimer shown · firebreak
unchanged · manual admin invite list.

From STEP 4 (frozen): no change to classifier thresholds, bridge wording,
retention, abuse-disclosure, human-review, A2 crisis arms, onboarding
free-text. Onboarding free-text (MO-2) stays gated on the STEP 8
firebreak path; alpha onboarding is **Room 1 name + emotional contract
only, no free-text persistence** unless/until that path exists.

## 3. Architecture for the single VPS

```
VPS (docker-compose, private; firewalled; no public registration)
├── postgres      (one engine; FOUR roles, NOT one superuser at runtime)
│     ├─ app/migration creds  (admin, migrations only)
│     ├─ mello_quarantine_rw
│     ├─ mello_safety_events_append
│     └─ mello_suppression_rw
├── qdrant        (memory vectors; not in crisis path)
└── api           (NestJS) + colocated Python retriever in the SAME image
      (resolves AD-7/AD-3: retriever tree shipped with the API; entrypoint
       path valid in-container)
```

Reverse proxy terminates TLS; the app is reachable only to invited
testers (allowlist / basic gate / VPN — operator choice, documented).

## 4. Work items

### 5.1 Unified compose (resolves AD-7 / AD-10 / AD-3)
- One `deploy/docker-compose.alpha.yml` bringing up postgres, qdrant, api.
- API image **includes the Python retriever tree** and a working
  `RETRIEVER_ENTRYPOINT` (the AD-3 fix is already in `.env.example`;
  verify it resolves *inside* the container).
- Redis only if a job substrate is actually used in alpha (AD-10);
  otherwise omit — do not ship unused infra.

### 5.2 Credential isolation enforced at deploy (operationalizes AD-1)
- Compose/env wiring provides the four **distinct** credentials.
- **Deploy-time refusal:** the API must fail to start if
  `QUARANTINE_/SAFETY_EVENTS_/SUPPRESSION_DATABASE_URL` are missing, equal
  to each other, or equal to the admin/migration URL. (A startup check —
  this is *new non-crisis guard code*, it does not alter the firebreak.)

### 5.3 No public registration / admin-only accounts
- Registration endpoints disabled or feature-flagged off.
- Accounts created only by an admin script/seed from a manual invite
  list. Adults-only attestation captured at invite time (operator
  process, documented; not a UI free-text field).

### 5.4 Alpha disclaimer gate
- A static, non-free-text acknowledgement screen shown before first use:
  states mellō is not therapy / not a crisis service / not medical
  advice; that it is an internal alpha; that crisis language will
  interrupt and route to human resources. Acknowledge-to-continue.
- Static copy only — **not** model-generated, **not** crisis wording
  (the firebreak's own scripted screen is unchanged and separate).

### 5.5 Feature flags
- Server-driven flags to keep gated surfaces OFF in alpha: paid/billing,
  public signup, onboarding free-text Rooms (2–7 and the Room-1
  free-text sub-step until MO-2), future-self generation if it would
  touch unbuilt services (AD-9).
- Flags fail **safe** (unknown/unreachable ⇒ feature OFF).

### 5.6 Logging sanity check
- Assert (and document) that application logs contain no journal or
  crisis content. The classifier path already proves this in tests
  (4B-H/B3); add a deploy-time log scan over a smoke run as belt-and-
  braces. No third-party log shipping of content.

### 5.7 Safety smoke tests on deploy (the keystone of STEP 5)
A scripted post-deploy check that **fails the deploy** if any holds:
1. the four DB URLs are not four distinct credentials (5.2);
2. a synthetic crisis input through the screening path does **not**
   produce a firebreak (uses existing safety test harness style; no
   real user data; no new crisis logic);
3. a synthetic crisis input's text appears in any log line, the journal
   store, embeddings, or retrieval (must be absent);
4. classifier dependency forced-down does **not** yield "proceed"
   (fail-closed still holds in the deployed env);
5. public registration endpoint is reachable (must be **disabled**);
6. the alpha disclaimer gate is bypassable (must not be).
This is verification, not new crisis behaviour — it re-asserts the
already-built guarantees in the *deployed* environment.

## 5. What is explicitly OUT (gated)

Public signup · paid · minors · 4E wording · classifier tuning ·
A2 crisis-arm deletion · onboarding free-text persistence · future-self
on unbuilt services (AD-9) · any OPEN-4D value. The 4D packet remains the
public-launch gate.

## 6. Acceptance criteria

- `docker-compose.alpha.yml` brings the stack up on one VPS; API
  refuses to start without four distinct DB credentials.
- No public registration path; accounts only via admin invite seed.
- Disclaimer gate shown and non-bypassable; copy is static and carries
  the non-therapy / not-a-crisis-service language.
- Safety smoke tests (5.7) run on every deploy and **block** a bad deploy.
- `tsc` 0 and the existing 7 suites / 84 tests still green; any new
  guard code (5.2/5.7) is non-safety and unit-tested.
- Nothing in §"OUT" shipped or unlocked.

## 7. Build order (safe-now vs needs-operator)

Safe to implement on-keyboard now (no VPS, no gated surface):
1. 5.2 startup credential-distinctness guard (+ unit test).
2. 5.7 safety smoke-test script (reuses existing harness patterns).
3. 5.1 `deploy/docker-compose.alpha.yml` + API image colocating the
   retriever.
4. 5.5 feature-flag scaffold (fail-safe-off) + 5.3 disable public
   registration.
5. 5.4 disclaimer-gate (static screen + acknowledge state) — minimal,
   non-free-text.

Needs the operator (off-keyboard): provisioning the VPS, DNS/TLS, the
real four DB credentials/secrets, the invite list, and running the
deploy. Engineering ships everything that does not require those.

## 8. Tracking → `docs/follow-ups.md`

S5-1 credential-distinctness startup guard · S5-2 deploy safety smoke
suite · S5-3 unified alpha compose + retriever colocation · S5-4
feature-flag scaffold · S5-5 disable public registration / admin invite
seed · S5-6 static alpha disclaimer gate. Specs; implementation is the
next explicit task, in the order in §7.

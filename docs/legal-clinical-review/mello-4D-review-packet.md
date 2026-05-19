# mellō — 4D Legal / Clinical Review Packet

**Consolidated review document — BUILD OUTPUT.** The per-topic files in `docs/legal-clinical-review/` are canonical if they ever disagree with this concatenation.

Prepared by engineering, 2026-05-19. Not an internal sign-off — a structured handoff for external legal/clinical review.

**The ask:** *Here is exactly what mellō does in a crisis, and exactly what data does and does not move. What must change before launch?*


## Contents

1. README
2. safety system summary
3. crisis flow
4. classifier baseline summary
5. review scenarios
6. open questions
7. data retention questions
8. abuse disclosure questions
9. terms disclaimer draft



<!-- ===== README.md ===== -->

# mellō — Legal & Clinical Review Packet (STEP 4D)

**Status:** prepared by engineering for external review. **Not** an internal
sign-off. Nothing in this packet is a legal or clinical decision; every
such decision is explicitly deferred to the reviewer.

**Date prepared:** 2026-05-19
**Prepared for:** a healthcare / mental-wellness attorney, and (recommended)
a licensed clinician.
**Scope of the ask:** *not* "is this app okay?" — instead: **"Here is
exactly what mellō does in a crisis, and exactly what data does and does
not move. What must change before launch?"**

---

## What mellō is (and is not)

- mellō **is** a private reflective journaling and memory practice — a tool
  for a person to think with over time.
- mellō **is not** therapy, counselling, or a substitute for either.
- mellō **is not** a crisis service, hotline, or emergency responder.
- mellō **is not** medical advice and **does not** diagnose, treat, monitor,
  or manage any mental-health condition.
- mellō contains a **crisis interruption safeguard** — a "firebreak" — whose
  sole job is to *stop the product* and *route the user to human help* when
  crisis-adjacent language is detected. It is a safety stop, not a feature.

This positioning is load-bearing for the legal review and is stated again,
verbatim, in `safety-system-summary.md`.

## How to read this packet

| File | What it answers |
|---|---|
| `safety-system-summary.md` | The whole crisis safeguard in plain language: detect → interrupt → stabilize → route → log → stop. No code required. |
| `crisis-flow.md` | The exact data-flow: where crisis text goes, and the explicit list of everywhere it provably never goes. |
| `classifier-baseline-summary.md` | The engineering evidence: what was built, tested, and measured (4B + 4C), including the live classifier baseline. |
| `review-scenarios.md` | Eleven concrete scenarios (the exact sentences a user might write, plus failure cases). For each: what the system does, what is stored, what is not, what remains unresolved. |
| `open-questions.md` | Every decision engineering deliberately did **not** make. The reviewer's worklist. |
| `terms-disclaimer-draft.md` | A **non-authoritative** starting draft of user-facing disclaimer language, for the attorney to rewrite — flagged as draft, not approved. |
| `data-retention-questions.md` | The restrictive-default retention posture and the specific retention questions for counsel. |
| `abuse-disclosure-questions.md` | Mandatory-reporting and duty-of-care exposure questions, isolated because they are jurisdiction-specific and the highest-risk area. |

## The one invariant the review must not weaken

> **Crisis material is acute-state material, not identity truth.**

A reviewer may change retention, wording, resource lists, severity
thresholds, escalation policy, and launch jurisdictions. The review must
**not** result in crisis text re-entering memory, embeddings, retrieval,
future-self generation, or reflective prompting. That isolation is the
spine of the design; everything else is negotiable.

## What engineering is explicitly NOT deciding

Severity thresholds · abuse-disclosure mandatory-reporting policy · raw
crisis-text retention duration · who (if anyone) may read quarantine or
`safety_events` · whether human review exists · whether a low-confidence
`risk:none` must still interrupt · default region/resource routing when
location is unknown · launch-jurisdiction limits · final ToS / Privacy /
onboarding / crisis-screen wording.

These are listed in full, as direct questions, in `open-questions.md`.
4D is **not complete** until the external review answers them.


<!-- ===== safety-system-summary.md ===== -->

# Crisis Safeguard — Plain-Language Summary

This document describes the mellō crisis safeguard with no code and no
jargon. It is the orientation document for the legal/clinical reviewer.

## Product positioning (stated plainly, for the record)

- mellō **is not therapy.**
- mellō **is not a crisis service.**
- mellō **is not medical advice.**
- mellō **does not diagnose, treat, or monitor** mental-health conditions.
- mellō **is** a reflective journaling and memory practice with a crisis
  **interruption safeguard**.

The safeguard exists so that the product does **not** attempt to help a
person through a crisis itself. It is a stop sign, not a counsellor.

## The crisis path is a firebreak, not a therapeutic feature

A firebreak is a gap cut deliberately so a fire cannot cross. When
crisis-adjacent language is detected, mellō does not soothe, counsel,
reflect, or "stay with" the user in any therapeutic sense. It interrupts
itself and points to humans who can help.

The lifecycle, in six words:

> **detect → interrupt → stabilize → route → log → stop**

| Step | What it means in practice |
|---|---|
| **detect** | Every journal/chat entry is screened by a crisis *signal classifier* before any normal processing. The classifier is infrastructure, not intelligence: it reads one message and emits a structured verdict. It never converses or counsels. |
| **interrupt** | If the verdict is anything other than "none", normal product flow stops for that entry. No reflective response is generated. Onboarding, if mid-flow, pauses gently. |
| **stabilize** | A **scripted, static** safety screen is shown — fixed wording, no AI-generated text. (The exact wording is OPEN for 4D.) |
| **route** | The screen points to human help appropriate to the user's region (e.g. a national crisis line). mellō does **not** contact anyone on the user's behalf in v1. |
| **log** | A **structured, non-text** safety event is recorded (risk type, severity, what response was shown) — never the user's words. |
| **stop** | mellō makes **no proactive contact** afterward — no next-day prompt, no letters, no nudges — until the user returns on their own or a time-box elapses. The user is not pursued. |

## Fail-closed, not fail-cold

If any safety-critical dependency fails — the classifier is unavailable,
its output is malformed, the secure crisis store is unreachable, the
region lookup fails, the screen fails to render — the system **does not**
resume normal product flow and **does not** go silent. It treats the
failure exactly like a detected crisis (the conservative direction) and
still shows a safety screen. A malformed classifier response is treated
**identically** to an outage. There is no code path from a failure to
"proceed."

This is deliberate: the dangerous failure is a missed crisis (a false
negative), so every ambiguity resolves toward interrupting.

## What the system never does

- It never generates free-form text *to* the user during a crisis. The
  safety screen is scripted and static.
- It never continues the reflective conversation, asks a follow-up
  question, or makes meaning of the disclosure.
- It never contacts emergency services, third parties, or named
  individuals on the user's behalf (v1).
- It never writes the crisis text into the journal, memory, or any
  learning/retrieval system. (Proven structurally — see `crisis-flow.md`.)
- It never persistently labels the *user* as "in crisis." It flags the
  *entry*. A later ordinary entry is processed normally.

## What remains for the reviewer

Engineering has built and verified the *mechanism*. The reviewer decides
the *policy values* the mechanism runs on: severity thresholds, retention,
mandatory-reporting handling, human review, default region behaviour,
low-confidence handling, disclaimers, and launch jurisdictions. These are
enumerated as concrete questions in `open-questions.md`.


<!-- ===== crisis-flow.md ===== -->

# Crisis Data-Flow — Where Crisis Text Goes, and Where It Provably Never Goes

This is the document a privacy/security reviewer should read most closely.
It describes data movement in plain terms. The architectural claims here
are enforced by automated tests (see `classifier-baseline-summary.md`),
not by convention.

## The flow

```
                       ┌─────────────────────────────┐
   User writes an  ───▶ │  Crisis signal classifier   │
   entry (journal/      │  (reads the text once,      │
   chat)                │   emits a structured        │
                        │   verdict; never converses) │
                        └──────────────┬──────────────┘
                                       │
                 risk = "none"         │        risk = anything else
              ┌────────────────────────┴───────────────────────┐
              ▼                                                 ▼
   ┌──────────────────────┐                      ┌──────────────────────────┐
   │  NORMAL FLOW          │                      │  FIREBREAK                │
   │  (journal, memory,    │                      │  1. Raw text → QUARANTINE │
   │   distiller, etc.)    │                      │     store ONLY            │
   └──────────────────────┘                      │  2. Scripted static       │
                                                  │     safety screen shown   │
                                                  │     (region-routed; the   │
                                                  │     screen never sees the │
                                                  │     user's text)          │
                                                  │  3. Proactive-contact     │
                                                  │     pause set (a date,    │
                                                  │     no content)           │
                                                  │  4. Structured safety     │
                                                  │     event logged (flags   │
                                                  │     only, no text)        │
                                                  │  5. STOP                  │
                                                  └──────────────────────────┘
```

Only the **classifier** and the **quarantine store** ever receive the raw
crisis text. Everything else downstream receives either nothing, or
non-text structured data (a risk label, a severity flag, a region code, a
date).

## Where crisis text goes (the complete list)

1. **The classifier.** It must read the text to classify it. The text is
   passed to a local `claude -p` subprocess on standard input (not as a
   command-line argument, so it cannot leak via process listings or
   shells). Classifier error messages are structural tokens only — they
   never embed the model's input or output.
2. **The quarantine store.** A dedicated database, reached only through a
   dedicated credential that has no read path for any other part of the
   system. Raw crisis text exists here and nowhere else. The starting
   retention posture is restrictive (see `data-retention-questions.md`).

That is the entire list. Two destinations.

## Where crisis text provably never goes

Each of these is a separate subsystem with **no credential, no import, and
no code path** to the quarantine store. A continuously-run test scans the
entire non-safety codebase and fails the build if any of them so much as
references the crisis store:

- `journal_entries` (the normal journal table)
- `chat_messages`
- the **distiller** (the component that summarizes entries over time)
- **embeddings** (vector representations used for search)
- **Qdrant** (the vector database / semantic memory store)
- **semantic memories** (the long-term memory records)
- **future-self generation** (projected-future-self letters)
- **retriever context** (what past material is surfaced into new sessions)
- **analytics** content
- application logs (crisis text is never written to a log line)

## The four isolated credentials

The isolation is by database permission, not by application logic. Four
separate credentials exist; no single one can do another's job:

| Credential (role) | Can do | Cannot do |
|---|---|---|
| application (normal) | read/write normal product data | **cannot read or write** the quarantine store |
| quarantine writer | **write** crisis text to the quarantine store | nothing else; not reused anywhere |
| safety-events appender | **append-only** structured safety events | cannot read, update, or delete them; no text column exists to write to |
| suppression writer | set/extend one date column ("paused until") | nothing else; column-scoped |

Defined in database migrations `0012` (quarantine store + writer role),
`0013` (append-only safety-events role), `0014` (column-scoped suppression
role). The structured safety-event record **has no field for raw text** —
leaking text into the audit log is not "discouraged," it is type-impossible.

## The non-text data that does flow downstream

So the reviewer knows exactly what *is* shared:

- **Risk label** (one of: none, suicidal_ideation, self_harm,
  abuse_disclosure, severe_acute_distress) — a category, not the words.
- **Severity flag** (none/low/medium/high).
- **Region code** (e.g. "US") — used to choose which static resource line
  to display. Never a guessed jurisdiction.
- **A pause-until date** — no content, no risk label attached; only "do
  not initiate contact until this date."
- **Structured safety-event row** — user id, risk type, severity, source
  (journal/chat), what response was shown, region of resources shown. No
  free text, no excerpt, no rawText field.

## The invariant restated

> Crisis material is acute-state material, not identity truth.

A person in crisis is not, for that reason, *defined* by the crisis. The
architecture refuses to let an acute moment become permanent identity data
the system reasons about later. The review may change policy values; it
should not breach this isolation.


<!-- ===== classifier-baseline-summary.md ===== -->

# Engineering Evidence Summary (4B + 4C)

This summarizes what was built and measured, so the reviewer can judge the
*reliability* of the mechanism, not just its design. It is evidence, not a
safety claim — the reviewer decides whether it is sufficient.

## 4B — the firebreak architecture

Built and verified single-threaded (deliberately not parallelized — the
crisis path is the one place "move fast" was rejected). Then independently
re-reviewed by four adversarial review passes (leakage, failure-mode,
coverage, voice-safety), and **hardened** in response to that review.

- **6 test suites / 40 tests** passing after the hardening pass.
- Classifier failure paths are **directly tested** (not assumed): the CLI
  missing, a non-zero exit, a timeout (process is killed), unparseable
  output, schema-rejected output — every one resolves to the conservative
  fail-closed verdict. A regression test also asserts the user's text
  never appears in any log line.
- The crisis-text isolation (see `crisis-flow.md`) is enforced by a
  build-failing scan over the **entire non-safety codebase**, with a
  self-test that deliberately plants a forbidden reference and confirms
  the scan catches it (so the guard cannot pass vacuously).

The post-review **failure-mode audit returned PASS**: no enumerated
dependency failure can resume normal flow; none is silent; none falls back
to the normal journal store.

## 4C — adversarial corpus + live baseline

A frozen, downward-only adversarial corpus of **39 samples** in messy
human phrasing, across every risk family plus true negatives.

- **Offline suite: 7 suites / 84 tests** passing. This deterministically
  proves that every corpus label, routed through the real interruption
  logic, interrupts (for positives) or proceeds (for negatives) — and that
  no positive sample reaches the journal/memory/distiller path.
- **Live baseline: 39 / 39 samples** classified by the real local model
  (`claude -p`, Haiku-class), run once as recorded evidence.

### Live baseline results

| Category | Samples | False negatives | Untolerated false positives | Mis-bucketed (still interrupted) |
|---|---|---|---|---|
| Suicidal ideation (direct / plan / action) | 7 | 0 | 0 | 0 |
| Passive ideation | 4 | 0 | 0 | 0 |
| Oblique / poetic / buried-in-ordinary-text | 4 | 0 | 0 | 0 |
| Dark-humour / ambiguous masking | 3 | 0 | 0 | 0 |
| Self-harm | 3 | 0 | 0 | 0 |
| Abuse disclosure (incl. child disclosure) | 4 | 0 | 0 | 0 |
| Severe acute distress (psychosis/intoxication/derealization) | 4 | 0 | 0 | 0 |
| True negatives (incl. grief, conflict, fiction reference) | 10 | 0 | 0 | 0 |
| **Total** | **39** | **0** | **0** | **0** |

Recorded at `api/src/safety/tests/fixtures/crisis-corpus.baseline.json`.

### How to read this evidence (important caveats for the reviewer)

- This is a **39-sample baseline**, not a clinical validation study. It
  demonstrates the mechanism behaves conservatively on a hand-built
  adversarial set. It does **not** establish a statistical sensitivity /
  specificity rate over a representative population.
- The corpus is **frozen downward-only**: future changes may add harder
  samples but cannot quietly remove inconvenient ones. A future model or
  prompt change that regresses any sample fails the gated suite.
- "Mis-bucketed (still interrupted)" is tracked but **not** treated as a
  failure by engineering, because the firebreak still activates. *Whether
  bucket precision matters* (e.g. distinguishing active vs. passive
  ideation for escalation) is a **clinical decision for 4D**, not an
  engineering one.
- The model used is a local Haiku-class model invoked via CLI subprocess.
  No third-party hosted API is called. (This is an architectural
  constraint of the project.)

## What this evidence does and does not support

**Supports:** the mechanism interrupts on a broad adversarial set
including oblique and masked language, fails closed on every tested
dependency failure, and structurally cannot leak crisis text into memory.

**Does not, by itself, support:** any claim about real-world clinical
adequacy, legal sufficiency of disclaimers, duty-of-care posture, or
fitness for any jurisdiction. Those are the review's job — see
`open-questions.md`.


<!-- ===== review-scenarios.md ===== -->

# Review Scenarios

Eleven concrete scenarios — the actual sentences a user might write, plus
the operational failure cases. For each: **what the system does**, **what
is stored**, **what is not stored**, and **what remains legally/clinically
unresolved**. These map to the 39-sample corpus baseline (all passed) and
the tested failure paths.

---

### 1. User writes: *"I don't want to be here anymore."*
- **Does:** classified as suicidal-ideation-class risk → firebreak.
  Scripted safety screen with region resources. No reflective response.
- **Stored:** raw text → quarantine only; structured safety event
  (risk type, severity, date, response shown); proactive-pause date.
- **Not stored:** nothing in journal, memory, distiller, embeddings,
  retriever, future-self, analytics, or logs.
- **Unresolved (4D):** severity threshold meaning; whether any human
  escalation should exist; exact screen wording.

### 2. User writes: *"I already took something."* (possible active attempt)
- **Does:** firebreak, same mechanism. Treated as high-acuity.
- **Stored / Not stored:** same isolation as #1.
- **Unresolved (4D):** this is the sharpest duty-of-care question — is
  "route to resources, do not act" defensible when language suggests an
  **in-progress** attempt? Whether the product must do more than display a
  number is **explicitly a legal/clinical decision**, not made by
  engineering.

### 3. User writes: *"My partner hit me again."* (adult abuse disclosure)
- **Does:** classified `abuse_disclosure` → firebreak, identical handling.
- **Stored / Not stored:** same isolation.
- **Unresolved (4D):** mandatory-reporting exposure by jurisdiction;
  whether abuse-specific resources must be shown. See
  `abuse-disclosure-questions.md`.

### 4. User writes: *"My child told me someone hurt them."* (third-party / minor)
- **Does:** classified `abuse_disclosure` → firebreak. Engineering does
  **not** treat third-party/minor disclosures differently — by design,
  pending counsel.
- **Stored / Not stored:** same isolation.
- **Unresolved (4D):** likely the **highest** mandatory-reporting
  exposure. Whether minor-involving disclosures require distinct behaviour
  is a legal determination. Flagged as a candidate launch-jurisdiction
  exclusion until resolved.

### 5. User writes: *"I haven't slept and people are watching me."*
- **Does:** classified `severe_acute_distress` (the uncategorized-acute
  catch-all covers psychosis/intoxication/incoherence) → firebreak.
- **Stored / Not stored:** same isolation.
- **Unresolved (4D):** whether catch-all sub-types ever need distinct
  resources/handling; threshold for "acute" vs "tender."

### 6. User writes grief, no acute risk (e.g. *"I miss my dad. The funeral was today and it was heavy."*)
- **Does:** classified `none` → **normal flow proceeds**. mellō reflects
  as usual. *No firebreak.* (All 10 true-negative corpus samples,
  including grief and conflict, returned `none` in the live baseline.)
- **Stored:** normal journal/memory as the user expects.
- **Not stored:** no safety event, no quarantine, no pause — it was not a
  crisis and is not treated as one.
- **Unresolved (4D):** where exactly the line sits between heavy-but-
  ordinary and acute (the conservative bias means ambiguity resolves
  toward interrupting; the threshold is clinical).

### 7. Classifier is unavailable (subprocess down / cannot run)
- **Does:** **fail-closed.** The failure is treated identically to a
  detected crisis: no normal flow, safety screen still shown. There is no
  code path from this failure to "proceed."
- **Stored:** structured safety event recording a fail-closed response.
- **Not stored:** no normal processing of the entry occurs.
- **Unresolved (4D):** whether the fail-closed user-facing wording (a
  "something interrupted things" holding screen) is adequate; final
  wording frozen pending review.

### 8. Quarantine write fails (secure store unreachable)
- **Does:** still **firebreak**; the decision does not flip. The system
  does **not** fall back to writing the text anywhere normal — there is
  explicitly no journal-table fallback. The safety screen is still shown.
- **Stored:** structured safety event marked failed-closed. The raw text
  is **not** persisted anywhere (the only sanctioned destination failed,
  and there is no alternate).
- **Not stored:** nothing in any normal store; no silent retention.
- **Unresolved (4D):** whether a failed-to-quarantine crisis event
  carries any obligation (e.g. to retry, or to notify) — policy, not
  mechanism.

### 9. Region lookup fails / region unknown
- **Does:** firebreak proceeds; a **jurisdiction-neutral** resource line
  is shown. The system **does not guess** a country's crisis
  infrastructure and never renders an empty resource slot.
- **Stored / Not stored:** same isolation as a normal firebreak.
- **Unresolved (4D):** what the neutral fallback should actually say, and
  whether an unknown-region user in certain jurisdictions should be
  handled differently. Default/fallback region behaviour is OPEN — 4D.

### 10. User chooses the "quiet the screen" option
- **Does:** the safety screen offers a **screen-state** choice only —
  keep the support resources visible, or quiet the screen. Choosing quiet
  hides the resources; it does **not** resume reflective journaling, and
  mellō does **not** offer to "stay with" the user (no companionship
  framing — that is a deliberate, documented design rule).
- **Stored / Not stored:** the choice is a UI state; no additional crisis
  data is created.
- **Unresolved (4D):** exact wording of the choice and the quiet screen;
  whether resources must remain reachable after quieting.

### 11. The next-day proactive prompt would normally send
- **Does:** it is **suppressed.** A crisis event set a contentless "do
  not initiate contact until <date>" state. No morning/evening prompt, no
  Future Self letter, no nudge, until the user returns on their own or the
  time-box elapses. The user is not pursued.
- **Stored:** only the pause date (no risk label, no content, no
  stigmatising flag on the user).
- **Not stored:** no persistent "this user is in crisis" label —
  engineering flags the *entry*, never the *user*.
- **Unresolved (4D):** the length of the pause window (mechanism is
  deterministic and non-optional; the **number** is clinical); whether the
  mere existence of the pause date is a governed health inference.

---

## Cross-cutting note for the reviewer

In scenarios 1–5 and 7–9 the user-facing outcome is intentionally
**indistinguishable** in spirit: the product stops and points to humans.
The differences the reviewer must rule on are not in the mechanism (it is
uniform and tested) but in **policy**: thresholds, reporting, retention,
escalation, wording, and jurisdiction. Those are enumerated in
`open-questions.md`.


<!-- ===== open-questions.md ===== -->

# Open Questions for the Attorney / Clinician

Every item here is a decision engineering **deliberately did not make**.
Each is phrased as a direct question. Where the system has a *default
posture* until the question is answered, that default is stated — and in
every case the default is the **most restrictive defensible** one, so the
review *grants* latitude deliberately rather than *discovering* that
latitude was already broad.

Legend: **[L]** legal · **[C]** clinical · **[L+C]** both.

## A. Positioning & duty of care

1. **[L]** Are the non-therapy / non-crisis-service / non-medical-advice
   disclaimers (see `terms-disclaimer-draft.md`) sufficient, and where
   must they appear (ToS, Privacy Policy, onboarding, crisis screen, app
   store listing)?
2. **[L]** Does offering a crisis interruption safeguard at all create a
   duty-of-care or assumed-responsibility exposure that *not* having one
   would not? Does the firebreak design mitigate or increase that?
3. **[L]** Is "route to resources, do not act for the user" (no contacting
   emergency services or third parties in v1) a defensible posture, and
   what is the legal weight of the deliberate choice **not** to escalate?
   *(Default: no third-party contact. OPEN — 4D.)*

## B. Classifier thresholds & low-confidence behaviour

4. **[C]** What should the severity thresholds be — what does `low` vs.
   `medium` vs. `high` trigger? *(Engineering ships the mechanism; the
   values are unset. OPEN — 4D.)*
5. **[L+C]** Is a well-formed but **low-confidence `risk:none`** result
   legally/clinically acceptable to treat as "proceed", or must low
   confidence force an interrupt? *(Default today: a well-formed `none`
   is trusted; a malformed/with-error response is treated as a crisis.
   The mechanism for a confidence floor is cheap to add; the threshold is
   a clinical/legal number, not an engineering guess. OPEN — 4D.)*
6. **[C]** Does the active-vs-passive suicidal-ideation distinction need
   to drive different behaviour, or is uniform interruption adequate for
   v1?

## C. Abuse disclosure (isolated — see `abuse-disclosure-questions.md`)

7. **[L]** Are abuse disclosures subject to mandatory-reporting
   obligations in any target jurisdiction, and if so, what is the
   product's obligation given it has no verified identity, location, or
   real-time human? *(Default: no reporting, no third-party contact, route
   to resources. Must be lawyer-defined, never assumed. OPEN — 4D.)*
8. **[L]** Does receiving a disclosure about a *third party* (e.g. "my
   child told me someone hurt them") change the obligation?

## D. Data retention & access (see `data-retention-questions.md`)

9. **[L]** May raw crisis text be retained in quarantine at all? If yes,
   for how long, and under what legal basis? *(Default: retained only as
   long as needed to render the bridge and write the structured event,
   then purgeable on the normal delete-cascade. 4D may extend if law
   requires duty-of-evidence, or forbid entirely. OPEN — 4D.)*
10. **[L]** Who, if anyone, may ever read the quarantine store or the
    `safety_events` log? *(Default: no principal may read either beyond
    the append path — fully closed. 4D grants access deliberately or not
    at all. OPEN — 4D.)*
11. **[L]** Should there be human review of crisis events? If so, under
    what conditions, cadence, and controls? *(Default: none; no real-time
    human in the loop. OPEN — 4D.)*
12. **[L]** Is persistent crisis-risk labelling of a *user* ever
    permissible? *(Default: the system flags the *entry*, never the
    *user*; the only cross-session state is a contentless "do not initiate
    contact until <date>" pause. OPEN — 4D, given privacy/stigma stakes.)*

## E. Region & resources

13. **[L+C]** What is acceptable default/fallback behaviour when the
    user's region is unknown? *(Default: a jurisdiction-neutral line; the
    system must **not** guess a country's crisis infrastructure. OPEN —
    4D.)*
14. **[C]** Which resource lines are correct and current for each launch
    jurisdiction (the displayed numbers/services)? Final list is OPEN — 4D
    and must be jurisdiction-checked.

## F. Wording

15. **[L+C]** Final wording of: the scripted crisis screen, the holding
    screen shown on dependency failure, the minimal static fallback
    screen, the screen-state choice ("keep resources visible / quiet the
    screen"), the post-crisis state, and all disclaimers. *(Engineering
    has placeholders only; all crisis wording is FROZEN until this review.
    OPEN — 4D, finalized in 4E.)*

## G. Launch scope

16. **[L]** Which jurisdictions must be **excluded** at launch until
    separately reviewed (e.g. jurisdictions with strict mandatory-reporting
    or digital-health regimes)?
17. **[L]** Are there age-gating or minor-protection obligations that
    change any of the above?

---

### Engineering's standing constraint on the answers

The review may set or change retention, wording, resources, thresholds,
escalation policy, and launch jurisdictions. The review should **not**
result in crisis text re-entering memory, embeddings, retrieval,
future-self generation, or reflective prompting. If a required answer
would breach that isolation, that is itself a finding to surface, not a
change to make silently.

**4D is not complete until these are answered by qualified external
review.** Engineering will not invent any of them.


<!-- ===== data-retention-questions.md ===== -->

# Data Retention — Current Posture & Questions for Counsel

## The restrictive default (what the system does today)

Engineering adopted the **most restrictive defensible** retention posture
as a starting point — explicitly so that the review *loosens it
deliberately if law requires*, rather than *cleaning up a permissive
ambiguity*.

> **Default, non-optional:** quarantined crisis text is retained only as
> long as needed to (a) render the safety screen and (b) write the
> structured `safety_events` record. After that the raw text is purgeable
> on the same delete-cascade as all other user data. This is the starting
> posture, not a placeholder.

> **Default access:** no principal may read the quarantine store or the
> `safety_events` log beyond the append path. Fully closed. No human
> review, no real-time human in the loop.

4D may **deliberately extend** retention (e.g. if a duty-of-evidence
obligation exists) or **forbid retention entirely** — either is an
explicit decision over a known-restrictive default.

## What is stored, precisely

| Store | Contains | Credential access | Default retention |
|---|---|---|---|
| Quarantine store | the raw crisis text + structured fields (risk, severity, region, classifier confidence, user id) | write-only via a dedicated credential; **no read path** for any other subsystem | until bridge rendered + event written, then purgeable on delete-cascade |
| `safety_events` log | structured flags only: user id, risk type, severity, source, response taken, region shown. **No text column exists.** | append-only via a separate dedicated credential; cannot read/update/delete | per the structured-log retention the reviewer sets |
| Suppression state | one date column ("do not initiate contact until") — no content, no risk label | column-scoped writer credential | until the date elapses |

There is no other location where crisis text exists (see `crisis-flow.md`).

## Questions for counsel

1. **May raw crisis text be retained at all?** If not, the system must
   purge it the instant the bridge is rendered and the event written
   (mechanism already supports this).
2. **If retention is permitted, for how long, and on what legal basis?**
   (duty-of-evidence? incident investigation? none?)
3. **Does any jurisdiction require** retention (duty-of-evidence) — and
   does that conflict with another that requires deletion? How should a
   multi-jurisdiction conflict be resolved at launch scope?
4. **Who may access the quarantine store, ever?** Under what controls,
   logging, and authorization? (Default today: no one beyond the write
   path.)
5. **Who may access `safety_events`?** It contains no text but does record
   that a user had a crisis event of a given type on a given date — is
   that itself sensitive enough to restrict further?
6. **Delete-on-request interaction:** if a user requests account deletion,
   should crisis quarantine data be deleted on the same cascade, or is
   there a lawful basis / obligation to retain it separately? This
   directly conflicts with question 2/3 and needs an explicit ruling.
7. **The suppression date:** is storing "do not contact until <date>"
   (with no risk label or content) acceptable as non-sensitive, or does
   its mere existence imply a health inference that must be governed?
8. **Backups / logs:** confirm the retention ruling must also bind backups
   and any operational logs (engineering's design keeps crisis text out of
   logs entirely; backups of the quarantine store inherit its retention).

## Constraint on any answer

Whatever retention is set, it must not require crisis text to be copied
into any normal store to satisfy it. Retention can change *duration and
access* of the quarantine store; it must not relocate the data into
memory, analytics, or the journal to make retention "easier."


<!-- ===== abuse-disclosure-questions.md ===== -->

# Abuse Disclosure — Mandatory-Reporting & Duty Questions

This is isolated into its own document because it is the **highest-risk,
most jurisdiction-specific** area, and because engineering has
deliberately made **no** assumption about it in either direction.

## What the system does today (mechanism only)

When the classifier labels an entry `abuse_disclosure`, the behaviour is
**identical** to every other crisis risk:

- interrupt the normal flow,
- show the scripted, static safety screen with region-routed resources,
- quarantine the raw text (isolated store, see `crisis-flow.md`),
- write a structured safety event (no text),
- set the proactive-contact pause,
- stop.

The system does **not**:

- contact authorities, child-protective services, or any third party;
- attempt to identify, locate, or verify the user or any named person;
- treat a third-party disclosure ("my child told me…") differently from a
  first-person one;
- make any judgement about credibility or obligation.

This is the **default-deny** posture: do nothing beyond routing the user
to resources, until counsel defines otherwise. It is *not* a claim that no
obligation exists — it is a refusal to assume one either way without
qualified review.

## Why engineering cannot decide this

- Mandatory-reporting law is jurisdiction-specific and varies by reporter
  type, victim type (minor vs. adult), and channel.
- mellō has, by design, **no verified identity and no location** for the
  user — which itself bears on whether any reporting duty could even
  attach or be dischargeable.
- A reporting obligation, if one applied, would directly collide with the
  product's privacy posture and the restrictive retention default. That
  collision must be resolved by counsel, not code.

## Questions for the attorney

1. In each intended launch jurisdiction, do mandatory-reporting
   obligations attach to a software product receiving an abuse disclosure
   from an **adult user about themselves**?
2. Do they attach when the disclosure is about a **minor** (the user's
   child, or the user as a past minor)?
3. Does the product's lack of verified identity/location remove, reduce,
   or **fail to discharge** any such duty (i.e. could "we couldn't report
   because we don't know who/where" itself be a liability)?
4. Is there a duty to *display specific reporting resources* (vs. general
   crisis resources) on an abuse disclosure?
5. Does logging that an `abuse_disclosure` event occurred (a category +
   date, no text) create any obligation or exposure on its own?
6. If any reporting duty exists, **what is the minimal lawful mechanism**,
   given the architecture must not pull crisis text into normal stores or
   build a surveillance pathway? (e.g. is a documented "we do not and
   cannot report; here are resources" posture defensible, with disclosure
   to the user?)
7. Should any jurisdiction be **excluded at launch** specifically because
   of abuse-disclosure reporting regimes, until a compliant mechanism is
   designed and separately reviewed?
8. Must the user be **told**, before they write, what mellō will and will
   not do with an abuse disclosure (consent/disclosure timing)?

## Constraint on any answer

If counsel determines a reporting mechanism is required, it must be
designed as a **new, separately reviewed** pathway — it must not be
implemented by widening quarantine access, copying crisis text into a
normal store, or attaching identity to the suppression state. Any required
mechanism that would breach the core isolation is a finding to escalate,
not a change to make quietly.


<!-- ===== terms-disclaimer-draft.md ===== -->

# Disclaimer Language — NON-AUTHORITATIVE DRAFT

> ⚠️ **This is a starting draft written by engineering for the attorney to
> rewrite. It is NOT approved language and must NOT ship as-is.** Its only
> purpose is to give counsel a concrete artifact to react to instead of a
> blank page. Every sentence is a question, not a claim.

The attorney decides: the wording, where each piece appears, whether each
is sufficient, and what additional language is legally required.

## D1. Product positioning (candidate — for rewrite)

> mellō is a private journaling and reflection tool. It is not therapy,
> counselling, medical or mental-health advice, and it is not a crisis or
> emergency service. mellō does not diagnose, treat, monitor, or manage
> any health condition. If you are in crisis or may be in danger, contact
> your local emergency services or a crisis line — mellō cannot do this
> for you.

**For counsel:** Is this accurate and sufficient? Is "tool" vs. "service"
the right framing? Does it need a more explicit limitation-of-liability
and assumption-of-risk construction?

## D2. Crisis-screen footer (candidate — for rewrite)

> mellō noticed language that may signal you're going through something
> serious. mellō is not able to help with this itself and is pausing here.
> The resources above can. You are not being judged or reported.

**For counsel:** Is "not being judged or reported" safe to state given the
unresolved mandatory-reporting question? Should it be removed until that
is decided? (Engineering has **not** assumed an answer either way.)

## D3. Onboarding consent point (candidate — for rewrite)

> Sometimes mellō will detect that an entry may involve crisis, harm, or
> abuse. When that happens, mellō stops normal journaling for that entry,
> shows you support resources, and records that a safety event occurred
> (a category and a date — never what you wrote, which is stored
> separately and is not used to learn about you). mellō will then not send
> you prompts or messages for a while.

**For counsel/clinician:** Is this an adequate, comprehensible disclosure
of the crisis behaviour and the data handling? Is explicit consent
required, and at what point?

## D4. Privacy-policy crisis clause (candidate — for rewrite)

> If a potential crisis is detected, the text of that entry is stored in a
> separate, restricted location used only to display support resources and
> to record a structured safety event. It is not added to your memory,
> not used to personalize mellō, and not used to train anything. Its
> retention is governed by [RETENTION POLICY — see data-retention-questions.md].

**For counsel:** The bracketed retention policy is itself an open question
(`data-retention-questions.md`). This clause cannot be finalized before
that is answered.

## D5. Things engineering explicitly did NOT write into any draft

Because these are legal/clinical determinations, the drafts above
deliberately make **no** statement about:

- whether mellō has, or disclaims, any duty of care;
- any mandatory-reporting position;
- a specific retention duration;
- whether anyone reviews crisis events;
- jurisdiction availability or exclusions.

These gaps are intentional. They are the attorney's to fill.

## Placement matrix (proposed — for counsel to confirm/redo)

| Language | Proposed location | Counsel decision |
|---|---|---|
| D1 positioning | ToS, app-store listing, onboarding | ? |
| D2 crisis footer | the scripted crisis screen | ? (also see wording-freeze: OPEN-4D) |
| D3 onboarding consent | onboarding flow, before first entry | ? (consent timing) |
| D4 privacy clause | Privacy Policy | ? (blocked on retention) |

Final crisis-screen wording is **frozen** pending this review and is
finalized in STEP 4E, after 4D answers land.

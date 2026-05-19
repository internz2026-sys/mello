# mellō — Safety Boundary

> Canonical operational boundary for crisis handling. Supersedes any crisis
> rules scattered in `voice/character-bible.md`, `voice/onboarding-script.md`,
> the audits, or architecture notes. Where this document and any other
> conflict, **this document wins** for anything crisis-related.
>
> Status: DRAFT — not in force. No real user may submit an entry until the
> legal review (STEP 4D) clears this document and the ToS. Engineering may
> build against it (4B/4C); wording and thresholds are not final until 4D.
>
> Version: 0.2 — 2026-05-19 (hardened: interface-state fork,
> uncategorized-acute catch-all, quarantine-by-credentials, cross-session
> proactive suppression, default-deny logging)

---

## 1. The principle: a firebreak, not a feature

mellō's crisis system exists to **interrupt and bridge**, never to manage,
counsel, or accompany a crisis. The moment mellō appears to *handle* a crisis
rather than *stop and route* it, the product has drifted into quasi-therapy —
operationally and legally.

The whole behaviour is six verbs, in order:

**detect → interrupt → stabilize → route → log → stop.**

Not: counsel, soothe deeply, interpret, continue reflective dialogue,
"process" the crisis, generate comfort prose.

Everything else in this document is the disciplined application of that one
sentence.

---

## 2. What mellō WILL do

- **Detect** acute-risk signals on every journal entry and chat message,
  before that text reaches the distiller or any other pipeline.
- **Interrupt** the normal flow immediately on a positive detection.
  Onboarding pauses. Journaling pauses. No further prompts.
- **Stabilize** with a short, scripted, human-vetted message (Section 8).
- **Route** to real human help: region-appropriate crisis resources.
- **Log** the event to `safety_events` (append-only) for accountability.
- **Stop.** Offer the user a choice about the **interface state** — keep
  the support resources on screen, or quiet the screen — then do exactly
  that, nothing more. The choice is about what the screen does, not about
  mellō "staying with" them. mellō is not a companion in the crisis; it
  is the surface that routed them to help and then holds still.

## 3. What mellō WILL NEVER do

- Never generate crisis response prose with the model. The bridge is
  scripted templates, not Claude output.
- Never continue reflective dialogue, ask deepening questions, or
  "explore the feeling" during a crisis state.
- Never offer therapeutic reframing, interpretation, or diagnosis.
- Never offer spiritual interpretation or scripture during a crisis,
  regardless of `spiritual_opt_in`.
- Never produce long comfort paragraphs, inspirational language, or
  "you matter so much" speeches.
- Never let crisis-state text enter the memory engine (Section 9).
- Never claim or imply it is a crisis service, therapy, counsellor, or
  medical provider.
- Never silently drop a crisis disclosure because a component failed
  (Section 7 — fail closed, not cold).

---

## 4. The classifier — infrastructure, not intelligence

The classifier is fast, conservative, narrow, and boring. It does not
reason emotionally, converse, or generate prose. It emits a structured
verdict only.

Output contract (structured enum, no freeform text — this minimizes the
hallucination surface):

```json
{
  "risk": "none | suicidal_ideation | self_harm | abuse_disclosure | severe_acute_distress",
  "severity": "none | low | medium | high",
  "interrupt": true,
  "allow_distillation": false,
  "allow_memory": false,
  "resource_region": "US",
  "confidence": 0.0
}
```

Rules:

- Runs via `claude -p` (Haiku-class, per the no-API directive), NOT the
  Anthropic SDK.
- **Conservative bias.** False positives (interrupting a non-crisis) are
  recoverable and low-harm. False negatives are not. When uncertain
  between `none` and a risk category, choose the risk category.
- **Uncategorized-acute catch-all (hard invariant).** Any signal the
  classifier reads as acute but cannot confidently place in a category —
  psychosis or delusion indicators, intoxication, incoherent acute
  states, ambiguous dangerous language — defaults to
  `severe_acute_distress` and triggers the full firebreak. The system is
  never "safe by accident because it fell through." Uncategorized-acute
  is a *defined* state with *defined* behaviour.
- Any `risk != none` forces `allow_distillation=false` and
  `allow_memory=false`, regardless of severity.
- `resource_region` derives from `profiles.locale` / declared region.
  Default and fallback region behaviour is **OPEN — 4D** (must not guess
  a jurisdiction's crisis infrastructure).

The severity → action thresholds (what `low` vs `high` triggers) are an
**OPEN — 4D** clinical question. Engineering ships the mechanism; the
threshold values are set with qualified review, not invented here.

---

## 5. Escalation matrix (mechanism defined; thresholds OPEN — 4D)

| risk | engineering behaviour | clinical/legal decision (OPEN — 4D) |
|---|---|---|
| `suicidal_ideation` | interrupt, scripted bridge, quarantine, log | active vs passive distinction; whether any human escalation beyond resource-routing exists, and to whom |
| `self_harm` | interrupt, scripted bridge, quarantine, log | severity thresholds; resource set |
| `abuse_disclosure` | interrupt, scripted bridge, quarantine, log | **mandatory-reporting exposure varies by jurisdiction — must not be assumed; legal-defined** |
| `severe_acute_distress` (incl. uncategorized-acute catch-all: psychosis, delusion, intoxication, incoherent or ambiguous dangerous language) | interrupt, scripted bridge, quarantine, log | where the line sits between "tender journaling" and "acute"; whether catch-all sub-types ever need distinct handling |

mellō does not contact third parties, emergency services, or named
individuals on the user's behalf in v1. Whether it ever should, and the
legal weight of choosing not to, is **OPEN — 4D**. Until decided, the
system routes the user to resources and does not act for them.

---

## 6. Interruption rules

On any `interrupt=true`:

1. The triggering text is **not** distilled, embedded, pattern-matched,
   reinforced, or written to semantic memory. It enters quarantine
   (Section 9) only.
2. Onboarding (if mid-flow) pauses at the current room. The user may
   resume or exit gently afterward — never forced forward.
3. No normal AI response is generated for that turn. The scripted bridge
   replaces it.
4. The interrupt is per-entry for *reactive* behaviour. A later,
   non-crisis entry is processed normally. mellō does not flag the *user*
   as "in crisis" persistently; it flags the *entry*. (Persistent
   crisis-risk labelling of a user is **OPEN — 4D** — real privacy and
   stigma implications.)
5. **Cross-session proactive suppression (hard rule).** A crisis event
   sets a time-boxed, non-semantic `proactive_engagement_paused_until`
   state. While set, mellō makes **no proactive contact**: no morning
   prompt, no evening prompt, no Future Self letter, no relationship
   nudge, no values reminder, no re-engagement of any kind. The user is
   not pursued. Normal behaviour resumes only when the user *themselves*
   returns and initiates, or the time-box elapses (its length is
   **OPEN — 4D**; the *mechanism* is deterministic and not optional).

   This is deliberately a different object than crisis-risk labelling
   (rule 4). It is not "this user is a risk." It is "do not initiate
   contact for a while." It carries no risk classification, no semantic
   content, no stigmatising label — only a date and a pause. Resolving
   the tension this way preserves the no-persistent-labelling posture
   *and* prevents the system from becoming emotionally coercive the
   morning after acute distress. Without this rule, the next day's
   *"What's true today?"* or a Future Self letter becomes the haunting.

---

## 7. Failure behaviour — fail closed, not cold (ALL safety-critical deps)

**The invariant:** *any* safety-critical dependency failure, after crisis
suspicion or detection, fails closed, not cold. Not only the classifier.
Safety-critical dependencies:

- classifier outage
- malformed / unparseable classifier response
- quarantine-store write failure
- `safety_events` append failure
- region-resource lookup failure
- scripted-bridge rendering failure

"Fail closed" = the entry never reaches a normal path (journal, chat,
memory, embedding, distillation, Future Self, retrieval). "Not cold" =
the user is never met with a bare error after writing something that may
be a crisis disclosure.

### Classifier unavailable / errors / times out / returns malformed

1. Accept and hold the text in **volatile session memory only** — do not
   lose what the user wrote, do not persist it anywhere normal.
2. Do not distill, embed, or continue the normal flow.
3. Show the holding message:

   > *Something interrupted things just now. Before anything else — if
   > you might not be safe, please reach a person tonight: {region_line}.
   > What you wrote is held and going nowhere.*

4. Retry classification out of band. Resolve to normal flow only after a
   clean `risk=none`.

A malformed or unparseable classifier response is treated **identically
to an outage** — it is never optimistically interpreted as `risk=none`.

### Crisis detected but quarantine write fails

If crisis risk is detected but the quarantine write fails, the system
must NOT write the entry to any normal journal, chat, memory, embedding,
distillation, Future Self, or retrieval path. The user sees the scripted
bridge. The text is held only in volatile session memory for immediate
safety handling. Normal reflective flow remains paused. A retry job may
attempt quarantine persistence out of band. If persistence cannot be
confirmed, the system preserves the safety interruption and does not
resume normal product behaviour.

**Implementation note (the likely future mistake):** do **not** "fall
back" to the normal journal table for durability when quarantine write
fails. Durability is never a reason to move crisis text into a path the
retriever or distiller can reach. Volatile loss of an unpersisted crisis
entry is acceptable; leakage into the memory engine is not.

### safety_events append / region lookup / bridge render fail

- `safety_events` append fails → still fire the bridge, still quarantine
  (or hold volatile), still pause flow; the missing audit row is retried
  out of band. Absence of the log never un-pauses safety behaviour.
- Region-resource lookup fails → show a hardcoded **jurisdiction-neutral**
  safety message (generic "reach local emergency services or a crisis
  line near you" — *no specific number*, since no number is globally
  correct; final wording **OPEN — 4D**). Never render an empty resource
  slot; never display an unverified region-specific line.
- Scripted-bridge render fails → fail to a minimal static safety screen
  (plain-text resource line). Never fail to the normal product UI.

The distinction — closed architecture, warm surface — is mandatory across
every one of these paths.

---

## 8. The scripted bridge (templates; final wording OPEN — 4D)

Short. Steady. Minimally authored. Operationally clear. In acute states
cognitive load narrows; brevity is care, not coldness.

**Step 1 — interrupt + route (always):**

> *Before anything else — are you safe right now? If you might not be,
> please reach a person tonight: {region_line}. You don't have to do this
> alone.*

`{region_line}` examples (final list OPEN — 4D, jurisdiction-checked):
US — "988 (call or text)"; UK — "Samaritans 116 123". Never display a
region's line unless verified for that region.

**Step 2 — the interface-state fork (hard architectural fork):**

The choice offered is about the screen, not about companionship. mellō
does not offer to "stay with" the user — it offers to keep help visible
or to go still. (Conceptual correction, not wording polish: companion
language inside a crisis changes the product's implied contract and its
duty-of-care exposure at the worst possible moment.)

> *You can keep the support options on screen, or close this and let it
> be quiet. Either is okay.*  `[ Keep this here ]  [ Quiet ]`

- **Keep this here →** the resource line(s) remain on a still screen. No
  grounding "loop", no generated lines, no "I'm here" presence language.
  Just the routed resources, held visible, indefinitely, with nothing
  asked of the user. The screen does not speak.
- **Quiet →** a static screen with the resource line and one line:
  *"This will be here when you come back. Nothing you wrote is going
  anywhere."* Pause state. No prompting of any kind.

Both options are screen states, not companions. The earlier draft's
"minimal grounding loop" is **removed** — a loop becomes presence, and
presence becomes implied caregiving. The firebreak holds: route, hold the
screen still, stop.

Either branch ends the reflective product for that session **and** triggers
the cross-session proactive suppression in §6 rule 5. mellō does not
re-engage with prompts, summaries, or follow-ups after a crisis bridge —
not this session, and not proactively in following sessions until the
user returns on their own.

> Resolved (S1, 2026-05-19; hardened in 4B-H post-review): the
> `voice/character-bible.md` crisis example previously contained a
> reflective/companion fork ("stay quietly with you") and a hardcoded
> resource number. The post-4B voice-safety audit found the prior
> "Resolved" claim was not reflected in the bible text. The bible's
> crisis block has now been rewritten to restate **no** crisis copy at
> all — it describes the frame-break abstractly and defers wholly to this
> §8 for wording, the screen-state fork, region resolution, escalation,
> quarantine, and failure behaviour. One crisis script, here, not two.
> Do not reintroduce crisis copy into the bible.

---

## 9. Storage & quarantine — crisis material never enters the memory engine

Crisis-state cognition is acute-state material, **not identity truth**. If
it reaches the memory engine, the retriever eventually surfaces *"three
months ago you wanted to disappear"* — a catastrophic design failure.

Therefore a crisis-flagged entry:

- Is NOT distilled.
- Is NOT embedded or written to Qdrant.
- Is NOT semantically extracted, pattern-formed, reinforced, or
  importance-weighted.
- Is NOT used for Future Self synthesis.
- Is NOT retrievable by the normal retriever — excluded **by
  architecture, not by convention** (it lives in a store the retriever
  has no path to, not merely a filtered flag).

Quarantine is enforced by **physics, not policy** — it must be
*impossible*, not merely *discouraged*, for crisis text to reach the
memory engine:

- **Separate storage boundary:** a distinct table in a distinct schema
  (and, where the deployment allows, a distinct database) — not a flagged
  row in a shared table.
- **Separate credentials:** the distiller, embedding, retriever, and
  Future-Self service accounts have **no read grant** to the quarantine
  store. A pipeline cannot read crisis text *even if a future refactor
  asks it to* — the credential has no path. Leakage prevention is a
  permissions boundary, not a code convention a contributor must remember.
- Encrypted at rest; non-semantic (text + classifier verdict + timestamp
  only); no embeddings; no payload any retriever path can reach.
- Released into another system only by an explicit, logged,
  user-initiated action — never automatically, never by a service account.
- A structural **leakage test is a release gate** (§12 / 4C): CI must
  prove the distiller/embedding/retriever/Future-Self code paths *cannot*
  obtain quarantine rows, independent of classifier accuracy. Absent or
  failing that test, 4B is not done.

`safety_events` (already in schema, append-only RLS) records the *event*
only. **Default-deny logging — non-optional starting posture, not OPEN:**
`safety_events` stores structured flags only (risk, severity, response
given, region, timestamp) and **never raw user text**. No principal has
read access beyond the append path until 4D explicitly defines reviewers.
Raw crisis text exists *only* in the quarantine store under §10's stricter
lifecycle. 4D may *deliberately loosen* these defaults if law requires
(e.g. duty-of-evidence retention); it does not get to discover permissive
ambiguity and clean it up. The starting posture is the most restrictive
defensible one.

---

## 10. Retention policy (restrictive default; 4D may loosen, not tighten)

Non-optional default: quarantined crisis text is retained only as long as
needed to (a) render the bridge and (b) write the structured
`safety_events` record, then the raw text is purgeable on the same
delete-cascade as everything else (Blocker A2 / STEP 5). This is the
starting posture, not a placeholder. 4D may *deliberately extend*
retention if law requires duty-of-evidence, or *forbid* retention
entirely — either is an explicit decision over a known-restrictive
default, never a cleanup of ambiguity.

## 11. Human-review policy (default-deny; 4D may grant, not assume)

Default, non-optional: **no principal can read `safety_events` or the
quarantine store beyond the append path.** No real-time human in the
loop; routing is to external resources only. Who may ever review, on what
cadence, with what controls — all **OPEN — 4D**, but the default until
then is closed. 4D *grants* access deliberately; it never discovers that
access was already broad.

---

## 12. The adversarial corpus (STEP 4C — mandatory)

The classifier is only as good as the test set. The corpus must include
the *hard* cases, not just explicit phrases. At minimum:

- Indirect / passive ideation ("people would be better off without me")
- Exhaustion language ("I wish I could sleep for a year", "I can't do
  tomorrow", "I'm done")
- Dissociation / numbness language
- Ambiguity and dark humour / jokes
- Poetic or metaphorical phrasing of self-harm
- Disclosures buried inside otherwise ordinary entries
- Abuse disclosure, including oblique
- True negatives that *look* heavy but are not crisis (grief, venting,
  tiredness) — to measure false-positive rate against the conservative bias

The test suite is graded as rigorously as the classifier. A miss on a
low-certainty, emotionally-real disclosure is the failure that matters most.

**Two distinct test classes, both release gates for 4B/4C:**

1. *Classifier accuracy* — the adversarial corpus above: detection fires
   on the hard, low-certainty disclosures and stays quiet on true
   negatives.
2. *Quarantine leakage* — a structural test proving the distiller,
   embedding, retriever, and Future-Self code paths **cannot** obtain a
   quarantined crisis row (the credential boundary holds; no code path
   reaches it). Independent of classifier accuracy: a perfect classifier
   over a leaky quarantine still produces *"three months ago you wanted
   to disappear."* Absent or failing this test, 4B is not done.

---

## 13. Legal review gate (STEP 4D) — the actual critical path

Before any real user can submit an entry, a healthcare/privacy attorney
familiar with FTC §5 and state-level mental-wellness regulation must
review:

- This document (thresholds, escalation, retention, the OPEN items)
- The ToS / disclaimers — must state plainly mellō is **NOT** a crisis
  service, NOT therapy, NOT medical advice
- Jurisdiction exposure, mandatory-reporting questions, logging
  requirements, mandated escalation wording, regulatory classification

**Legal review happens before UX polish, not after.** Build the skeletal
pipeline, freeze copy, review early, then finalize. Finalizing wording and
flows before 4D risks discovering a mandated change after everything is
locked.

---

## 14. Sequencing and definition of done

- **4A** — this document. *(done — v0.2 hardened)*
- **4B** — technical skeleton. **Locked scope (no additions):**
  1. classifier contract (`claude -p` Haiku, structured enum,
     conservative, fail-closed, uncategorized-acute catch-all)
  2. quarantine write path (separate store, separate credentials)
  3. crisis interrupt middleware (the firebreak interception point)
  4. scripted bridge renderer (templates only — no model output)
  5. `safety_events` append path (structured flags only, default-deny)
  6. proactive-suppression flag (`proactive_engagement_paused_until`)
  7. leakage-prevention tests (the §12 structural release gate)

  **Scope discipline:** no UX refinement, no reflective wording, no extra
  intelligence, no model-generated prose anywhere. Just the firebreak.
  4B should feel almost infrastructural — that contrast with the rest of
  mellō is healthy and intentional. **Not done until the §12
  quarantine-leakage test exists and passes.**
- **4C** — adversarial corpus + regression suite (Section 12).
- **4D** — legal review (Section 13). **Critical path.**
- **4E** — final UX wording pass. Only after 4D.

**STEP 4 is not "done", and no user touches the product, until 4D clears.**
4B and 4C make the system structurally safe and give the legal reviewer
something concrete. They do not, by themselves, unblock launch.

STEP 4 is not where mellō becomes compassionate — it already is. STEP 4 is
where compassion becomes operational responsibility.

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

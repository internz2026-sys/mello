# mellō — 4D Legal/Clinical Review Packet · Index & Cover

**For:** healthcare / mental-wellness attorney; (recommended) a licensed
clinician familiar with suicide-risk triage; (if multi-country launch) a
privacy / data-protection advisor.

**Prepared by:** engineering, 2026-05-19. **This is not an internal
sign-off.** It is a structured handoff for external review.

---

## The ask — in one sentence

> **Here is exactly what mellō does in a crisis, and exactly what data
> does and does not move. What must change before launch?**

Please do **not** answer "is this app okay?" — answer the concrete,
enumerated questions in *Open Questions* (and the two isolated
high-risk areas: abuse-disclosure and data-retention).

## Positioning (stated up front, load-bearing for the review)

- mellō **is not** therapy, counselling, or a substitute for either.
- mellō **is not** a crisis service, hotline, or emergency responder.
- mellō **is not** medical advice; it does **not** diagnose, treat,
  monitor, or manage any condition.
- mellō **is** a private reflective-journaling and memory practice with a
  crisis **interruption safeguard** (a "firebreak") that stops the
  product and routes the user to human help.

## The one invariant the review must not weaken

> Crisis material is acute-state material, not identity truth.

You may change retention, wording, resources, thresholds, escalation
policy, and launch jurisdictions. The review should **not** result in
crisis text re-entering memory, embeddings, retrieval, future-self
generation, or reflective prompting. If a required answer would breach
that isolation, that is a finding to surface, not a change to make.

## Reading order

| # | Document | What it gives you |
|---|---|---|
| 1 | `README.md` | Orientation + how the packet is structured |
| 2 | `safety-system-summary.md` | The whole safeguard in plain language (no code): detect→interrupt→stabilize→route→log→stop |
| 3 | `crisis-flow.md` | Exact data-flow: the two places crisis text goes; the explicit list of everywhere it provably never goes; the four isolated DB credentials |
| 4 | `classifier-baseline-summary.md` | Engineering evidence (4B+4C) incl. the 39/39 live baseline — **with caveats**: a baseline, not a clinical validation study |
| 5 | `review-scenarios.md` | 11 concrete scenarios (the exact user sentences + failure cases): what's done / stored / not stored / unresolved |
| 6 | `open-questions.md` | 17 direct questions, tagged [L]/[C]/[L+C], each with its restrictive default |
| 7 | `data-retention-questions.md` | Restrictive retention posture + 8 questions for counsel |
| 8 | `abuse-disclosure-questions.md` | Mandatory-reporting / duty exposure — isolated, highest-risk |
| 9 | `terms-disclaimer-draft.md` | **Non-authoritative** disclaimer draft for the attorney to rewrite |
| — | `../right-to-delete-cascade.md` | How user data (incl. quarantined crisis text) is erased on a delete request — context for the retention questions |

A single consolidated file, `mello-4D-review-packet.md` (and its
rendered `mello-4D-review-packet.pdf`), contains documents 1–9 in this
order for offline reading. It is a **build output**; the per-topic files
above are canonical if they ever disagree.

## What engineering deliberately did NOT decide

Severity thresholds · abuse-disclosure mandatory-reporting policy · raw
crisis-text retention duration · who may read quarantine or
`safety_events` · whether human review exists · whether a low-confidence
`risk:none` must still interrupt · default region/resource routing when
location is unknown · launch-jurisdiction limits · final crisis/ToS/
privacy/onboarding wording.

These are the review's to decide. **4D is not complete until they are
answered by qualified external review.**

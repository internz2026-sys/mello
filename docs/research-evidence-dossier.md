# STEP 4D-R — Research-Backed Interim Safety Basis

**Status:** internal operating basis for a constrained alpha. **Not** a
legal or clinical opinion, and **not** a substitute for the external 4D
review. No code, classifier threshold, retention value, or crisis policy
is changed by this document — it sets *scope constraints* for who may use
the system now, and records the evidence that the **direction** of the
already-built design is consistent with credible public guidance.

**Decision recorded (2026-05-19):** the project operating rule changes
from *"nothing runs until 4D legal/clinical review"* to:

> Public launch and crisis-policy finalization remain blocked. A
> research-backed **internal alpha** may proceed under the strict
> constraints in §6. The 4D packet is retained, re-scoped as the
> **public-launch** review gate (timing changed, need not removed).

## Epistemic honesty (read first)

- This dossier argues that the **design direction** is defensible for a
  small, adults-only, invite-only internal alpha. It does **not** claim
  the system is clinically validated or legally cleared.
- The sources below are cited at the level of well-established public
  guidance. **Exact citations, URLs, dates, and quotations must be
  human-verified before this document is relied on outside the team.**
  Treat any specific claim as `[verify]` until checked.
- Research can support *that* a firebreak/route-to-human posture is the
  right shape. It cannot set the *numbers and policies* (severity
  thresholds, retention durations, mandatory-reporting posture, default
  region) — those remain OPEN-4D and are listed in §7.

---

## 1. Evidence supporting the firebreak model

The design choice — on detected crisis, **stop the AI product** and do
not continue reflective/therapeutic dialogue — aligns with the broad
consensus that general-purpose conversational AI should not attempt to
manage acute suicidal or self-harm crises itself.

- WHO treats digital interventions for self-harm/suicide as a distinct,
  evidence-sensitive area rather than a general wellness feature — which
  supports isolating crisis handling from ordinary product behaviour
  rather than blending it in. `[verify: WHO digital MH / self-harm
  guidance]`
- Recent peer-reviewed reviews of conversational AI in mental health
  (e.g. JMIR-family reviews) repeatedly flag weak empirical grounding,
  over-reliance, and accountability gaps — which supports a conservative
  "do not improvise care" posture. `[verify: specific JMIR review(s)]`

**Design consequence already implemented:** detect → interrupt →
stabilize → route → log → stop; no AI-generated crisis counselling; the
scripted bridge is static, not model-generated.

## 2. Evidence supporting human crisis-resource routing

Routing the user to **human** crisis infrastructure (e.g. 988 in the US;
local equivalents elsewhere) rather than continuing an AI conversation is
consistent with how crisis support is described by public health bodies.

- SAMHSA describes 988 as 24/7 support for people in suicidal crisis or
  emotional distress — i.e. crisis response is a **human** service. mellō
  pointing to that, and explicitly *not* substituting for it, matches the
  intended division of responsibility. `[verify: SAMHSA 988 description]`

**Design consequence already implemented:** region-routed static
resources; mellō does not act on the user's behalf (no third-party
contact in v1); the bridge offers a screen-state choice, never
companionship.

## 3. Evidence supporting crisis-data quarantine and privacy minimization

Strict data minimization and isolation of sensitive mental-health-related
content is supported by both enforcement precedent and statute.

- The FTC's action against BetterHelp shows that mishandling
  mental-health-related data and breaking privacy promises carries
  serious enforcement risk — which supports quarantine, no-analytics and
  no-advertising on journal/crisis content, and conservative retention.
  `[verify: FTC BetterHelp matter]`
- Philippines RA 10173 (Data Privacy Act) classifies health-related data
  as **sensitive personal information**, raising the bar for processing,
  retention, and access. `[verify: RA 10173 sensitive-PI definition]`
- Philippines RA 11036 (Mental Health Act) emphasizes **confidentiality**
  of mental-health-related information. `[verify: RA 11036
  confidentiality provisions]`

**Design consequence already implemented:** crisis text reaches only the
classifier and a credential-isolated quarantine store; it never enters
journal, memory, embeddings, Qdrant, retrieval, or future-self; four
separated DB credentials; restrictive default retention; default-deny
human access.

## 4. Evidence supporting classifier regression testing

The literature's emphasis on weak empirical guidance and accountability
supports treating detection as **infrastructure with a frozen,
downward-only regression suite**, not as an unbounded model behaviour.

**Design consequence already implemented:** 39-sample adversarial corpus
(direct/passive/oblique/masked ideation, self-harm, abuse, acute states,
true negatives); deterministic firebreak-wiring tests; an opt-in live
baseline (39/39 clean at last run) that hard-fails on any false negative
or untolerated false positive; fail-closed on every tested classifier
failure. This is a baseline, **not** a clinical validation study.

## 5. Philippine privacy / confidentiality considerations

Because the operator is in the Philippines and early alpha users may be
too:

- RA 10173 — health-related data is sensitive PI; processing requires a
  lawful basis, security, and minimization. Quarantine + minimization +
  default-deny access are aligned; **retention duration and access
  policy remain a legal decision (OPEN-4D).**
- RA 11036 — confidentiality of mental-health information is a statutory
  expectation; supports no-analytics/no-ads on crisis content and tight
  access control.
- This is **not legal advice.** It is the reason the alpha is constrained
  (§6) and the reason public launch stays gated until counsel reviews the
  packet.

## 6. Interim alpha constraints (LOCKED until professional review)

These are binding for the internal alpha and are enforced as **scope**,
not as new crisis logic:

1. **Internal alpha only** — manual invite list; no public signups.
2. **Adults only; no minors.** No unreviewed minor access under any path.
3. **No paid access.** No billing, no subscriptions enabled.
4. **No therapy/counseling/diagnosis/treatment/crisis-service claims**
   anywhere in product, store, or marketing copy.
5. **No advertising pixels.** None.
6. **No third-party analytics on journal or crisis content.** (Aggregate,
   non-content operational metrics only, if any.)
7. **No crisis text in memory, embeddings, retrieval, or future-self** —
   already enforced by construction; not to be relaxed.
8. **Clear onboarding disclaimer** stating what mellō is not (not
   therapy, not a crisis service, not medical advice).
9. **Clear crisis-resource routing** retained exactly as built
   (firebreak unchanged).
10. **Manual, admin-curated invite list only.**

Any change to items 7–9 is a crisis-policy change and is **out of scope**
until 4D returns.

## 7. What research cannot decide (still OPEN-4D — public-launch gated)

Evidence supports the *shape*; it does not set these, which remain locked
behind the external review and must not be invented by engineering:

- crisis disclaimer final wording (4E)
- mandatory-reporting exposure for abuse disclosures (esp. minors /
  third-party disclosures) under PH and any other launch jurisdiction
- quarantine retention duration; whether retention is permitted at all
- `safety_events` audit-log retention and whether it survives deletion
- human-review policy (who, if anyone, may ever read crisis records)
- default/fallback region/resource routing when location is unknown
- low-confidence `risk:none` handling (confidence-floor threshold)
- launch-jurisdiction exclusions; minor-protection / age-gating duties

These are exactly the questions in
`docs/legal-clinical-review/open-questions.md`. The packet there is now
the **public-launch review gate**.

## 8. Status of the 4D packet (not deleted — re-scoped)

`docs/legal-clinical-review/mello-4D-review-packet.pdf` and its source
docs are **retained unchanged in substance**. Their framing is updated
from *"required before anything runs"* to **"required before public
launch / real scale."** The need is not removed; its timing moved.

## 9. Sources (human-verify before any external use)

- SAMHSA — 988 Suicide & Crisis Lifeline (service description). `[verify]`
- WHO — guidance on digital interventions and self-harm/suicide
  prevention as an evidence area. `[verify]`
- JMIR-family systematic/scoping reviews — conversational AI in mental
  health: ethics, privacy, over-reliance, evidence gaps. `[verify exact
  papers, years, DOIs]`
- US FTC — enforcement action re: BetterHelp and mental-health-related
  data/privacy representations. `[verify matter + year]`
- Republic Act No. 10173 (PH Data Privacy Act) — sensitive personal
  information incl. health. `[verify section]`
- Republic Act No. 11036 (PH Mental Health Act) — confidentiality of
  mental-health information. `[verify section]`

> A teammate must replace every `[verify]` with a checked citation before
> this dossier is shown outside the core team or used to justify anything
> beyond the constrained internal alpha. Until then it is an internal
> working basis only.

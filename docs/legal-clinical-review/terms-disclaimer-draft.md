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

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

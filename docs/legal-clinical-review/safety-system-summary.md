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

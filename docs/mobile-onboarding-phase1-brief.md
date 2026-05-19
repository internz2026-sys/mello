# Implementation Brief — Phase 1 Mobile Onboarding (Option C)

**Status:** implementation brief. **No code in this artifact.** Defines
scope, gates, sequencing, and acceptance for the work; the build is a
later explicit task. Safe while 4D is externally blocked — touches no
crisis wording, classifier, retention, reporting, or A2 crisis arms. It
treats the existing firebreak as a **hard precondition**, never a change.

**Decision of record:** `docs/mobile-onboarding-plan.md` → Option C
locked 2026-05-19. Option A (full mobile onboarding) remains the
destination; it is not the first implementation surface for the deepest
rooms.

## 1. Goal

Ship the *arrival* on mobile — the first contact with mellō's voice and
the emotional contract — without building the full formation arc or the
seed letter on the harder platform under time pressure, and **without any
unsafe free-text path**. Author Rooms 2–7 on web first.

## 2. Scope

### Mobile (Phase 1) — IN
- **Pre-room welcome** (matches `voice/onboarding-script.md` "Pre-room").
- **Room 1 — Arrival**, in full per the canonical script:
  - opening + **name** capture (short identifier),
  - the emotional-contract lines ("known slowly… you can always change,
    hide, or delete"),
  - the **open free-text** prompt *"what brought you here today?"*
    (any length),
  - the four adaptive follow-up branches (short/guarded; specific
    person-event-struggle; vague "improve"; hustle/productivity red-flag),
  - the transition-out line.
- **Resume support** — a user who leaves mid-Room-1 returns to the same
  point; arrival is not restarted from zero.

### Mobile (Phase 1) — OUT (explicitly deferred)
- Rooms 2–7 (The Now, People, Becoming, Values, Spiritual, Promise).
- The **Room 7 seed letter** (a sanctioned first-person frame-break —
  stays web-first until copy + memory pipeline + crisis boundary are
  stable in one place).
- Any onboarding analytics, profile-completion prompts, progress funnels.

### Web (Phase 1) — IN
- Build **Rooms 2–7** from the canonical script, web as the source
  implementation for the deeper rooms.
- Room 6 spiritual question: opt-in / skippable, subtle, never preachy.
- Room 7 seed letter: web-first, treated as the most delicate surface;
  not "done" until stabilized.
- Every web free-text Room wired through the fail-closed crisis screen —
  this is the **STEP 8 reference implementation** the mobile path will
  later mirror.

## 3. The gating safety precondition (read before scoping the sprint)

Room 1 **contains reflective free-text** (the "what brought you here"
prompt). Per `docs/safety-boundary.md` §6, onboarding free-text is in
scope for the firebreak and onboarding "pauses at the current room" on a
crisis signal. Therefore:

> **No Room-1 free-text may be persisted, cached, or queued for later
> sync on mobile unless it has first passed through the crisis screen on
> a path that fails closed.** No offline drafts of the free-text answer.
> No sync-later shortcut. The screen must run before persistence, and a
> screen/dependency failure must not fall through to "save it anyway."

This makes the mobile firebreak path a **Phase-1 blocking dependency for
the Room-1 free-text sub-step**, not a Phase-2 concern. Two admissible
ways to honour it (decision point for the build task, not decided here):

- **3a. Gated full Room 1:** ship the whole Room 1 including the
  free-text, but only once the mobile screening path (mirroring the STEP
  8 web reference) is available and proven fail-closed.
- **3b. Split Room 1:** ship Pre-room + Room 1 *through the emotional
  contract and name* immediately; hold the *"what brought you here"*
  free-text sub-step (and its follow-ups + transition) behind the same
  screening-path readiness. The user still "arrives"; the reflective
  question lights up when the safe path exists.

Either is acceptable. What is **not** acceptable is shipping the
free-text answer with local persistence ahead of a fail-closed screen.

## 4. Sequencing

1. Web: firebreak-wired free-text Room (the STEP 8 reference) — this also
   unblocks the mobile path conceptually.
2. Web: Rooms 2–7 authored from the script (Room 6/7 last, deliberately).
3. Mobile: Pre-room + Room 1 emotional contract + name + resume.
4. Mobile: Room 1 free-text sub-step, gated on the mobile fail-closed
   screening path (3a or 3b).
5. Phase 2 (separate brief): Rooms 2–7 to mobile (→ Option A reached),
   only after web copy settles and the firebreak is proven on free-text.

The seed letter (Room 7) is explicitly **not** scheduled into Phase 1 on
either the mobile or the "rush it" track.

## 5. Guardrails (non-negotiable — from the planning spec)

No gamification / streaks / progress-as-achievement / "complete your
profile" / productivity framing. No exclamation points in copy. Script is
canonical — do not paraphrase warmer per platform. Room 6 stays opt-in.
Seed letter stays voice-doc-governed. **Zero crisis changes** — mobile
mirrors the existing firebreak; it does not add, soften, reword, or
re-scope it.

## 6. Acceptance criteria

- Mobile ships Pre-room + Room 1 (and resume) matching the canonical
  script verbatim in intent; Rooms 2–7 + seed letter are documented as
  deferred to Phase 2, not silently absent.
- No mobile code path persists/caches/sync-defers Room-1 free-text ahead
  of a fail-closed crisis screen. A screening or dependency failure on
  that path does not result in the text being saved.
- Resume returns the user to their exact arrival point without data loss
  and without re-prompting answered steps.
- Web has Rooms 2–7 from the script, each free-text room firebreak-wired
  (the STEP 8 reference); Room 7 seed letter present but flagged
  not-stabilized.
- No guardrail in §5 violated. Voice docs win on any copy conflict.

## 7. Non-goals / does not decide

- Does not write code, navigation, or copy.
- Does not finalize the mobile↔web hand-off after Room 1 (the user
  continues Rooms 2–7 on web in Phase 1) — that hand-off UX is MO-1.
- Does not decide 3a vs 3b — that is the build task's call at start,
  recorded then.
- Does not touch STEP 4, retention, or A2.
- Does not set offline policy beyond forbidding the unsafe default.

## 8. Dependencies & risk

- **Hard dependency:** mobile Room-1 free-text needs the fail-closed
  screening path (STEP 8 reference is web; mobile mirrors it). If STEP 8
  slips, choose 3b so the arrival still ships safely.
- **Risk:** "web-first onboarding" quietly becoming "onboarding never
  gets mobile depth." Mitigation: Phase 2 mobile port (MO-4) is logged
  now as committed scope, not aspirational.
- **Risk:** copy drift between platforms. Mitigation: single canonical
  script; no per-platform rewrites; web is the reference for 2–7.

## 9. Follow-ups (logged now — direction is chosen)

Recorded in `docs/follow-ups.md` under a Product/onboarding section:
- **MO-1** mobile↔web onboarding hand-off/resume after Room 1.
- **MO-2** mobile fail-closed crisis-screen path for onboarding
  free-text (mirrors STEP 8 web reference; blocking for Room-1 free-text).
- **MO-3** mobile offline policy for free-text (default: do not persist
  unscreened; blocked on MO-2).
- **MO-4** Phase 2 — Rooms 2–7 to mobile (Option A); committed scope.
- **MO-5** Web Rooms 2–7 build from canonical script (Room 6 opt-in,
  Room 7 seed letter web-first/not-stabilized-until-flagged).

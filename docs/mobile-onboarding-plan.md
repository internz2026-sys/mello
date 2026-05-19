# Mobile Onboarding — Phase 1 Planning Spec

**Status:** specification / decision brief only. **No code in this pass.**
Safe to write while 4D is with counsel: touches no crisis wording,
classifier, retention, reporting, A2 crisis-adjacent arms, or any locked
STEP 4 architecture. It *does* name the firebreak as a hard precondition
(a constraint to respect, not a change to make).

> ## DECISION — LOCKED (2026-05-19): Option C for Phase 1
>
> Mobile Phase 1 ships **Pre-room + Room 1 (Arrival) only**, with resume
> support. Web authors **Rooms 2–7** from the canonical script first
> (incl. the Room 6 spiritual opt-in and the Room 7 seed letter, kept
> web-first until stabilized). Mobile receives Rooms 2–7 in **Phase 2**,
> only after the free-text/firebreak path is proven.
>
> **Full mobile onboarding (Option A) remains the destination** — it is
> simply not the first implementation surface for the deepest rooms. No
> mobile free-text persists or sync-defers without passing the fail-closed
> crisis screen.
>
> Implementation brief: `docs/mobile-onboarding-phase1-brief.md`.
> The §4 analysis below is retained as the rationale of record.

## 1. Problem / Goal

Mobile does not implement the onboarding Rooms. Decide the Phase 1
posture: does mobile ship the full 7-room arrival, a subset, or stay
rituals-only with onboarding web-first — and write down exactly what is
deferred if it is not the full flow.

## 2. Technical Context

**Canonical source of truth:** `voice/onboarding-script.md` —
Pre-room welcome, then Room 1 Arrival (~2m), Room 2 The Now (~3m),
Room 3 The People (~2m), Room 4 The Becoming (~3m), Room 5 The Values
(~2m), Room 6 The Spiritual Question (~2m, **skippable**), Room 7 The
Promise (~1m, ends with the **seed letter**). ≈15 minutes total. The
voice docs win over any implementation.

**Mobile today (`apps/mobile`, Expo / React Native):**
- `app/index.tsx` — welcome screen
- `app/(rituals)/morning.tsx` (+ `_layout`) — morning ritual only
- `lib/voice/` — the voice/aesthetic primitives already exist on mobile
  (`Voice`, `Sanctuary`, `Pulse`, `Whisper`, `tokens`)
- **No onboarding flow, no Rooms.**

**Web today (`apps/web`):**
- `app/onboarding/room-1/page.tsx` — **only Room 1** exists.
- Rooms 2–7 are **not built on web either.**

**The decisive fact:** this is not a "port the web rooms to mobile"
problem. The 7-room flow does not fully exist anywhere yet. Whatever
platform builds Rooms 2–7 first is building them from the script, not
copying them. That reframes the options below.

**Hard cross-cutting dependency (not a crisis change — a constraint):**
Rooms 2, 3, 4, 5 collect free user text. Per `docs/safety-boundary.md`
§6 rule 2, onboarding free-text is in scope for the crisis firebreak and
"onboarding (if mid-flow) pauses at the current room." Therefore **no
mobile onboarding free-text may be persisted (or queued for later sync)
without first passing through the crisis screen on a path that can fail
closed.** This is a precondition on *any* option that puts free-text
Rooms on mobile. It does not change crisis behaviour; it forbids a mobile
offline-draft pattern that would bypass it.

## 3. Options

### Option A — Full mobile onboarding, Rooms 1–7
Mobile implements the entire arrival, matching the script.
- **Pros:** mobile is where reflective journaling will actually live;
  one coherent emotional arc; no platform seam through the most delicate
  first 15 minutes; the seed letter (Room 7) lands on the device the user
  keeps.
- **Cons:** largest Phase 1 surface; Rooms 2–7 don't exist yet anywhere,
  so this is net-new on the harder platform; the seed-letter frame-break
  and the skippable spiritual room (Room 6) are the most delicate copy in
  the product and should not be rushed to hit a mobile date; requires the
  firebreak integration (above) wired on mobile before any free-text Room
  can ship.

### Option B — Web-first onboarding, mobile rituals-only
Onboarding stays web; mobile keeps welcome + rituals for Phase 1.
- **Pros:** smallest mobile surface; build Rooms 2–7 once on web where
  Room 1 already exists and the firebreak web-wiring is the STEP 8
  reference; defers all delicate copy to one platform.
- **Cons:** forces a cross-platform seam exactly at first-run; a
  mobile-first user must start on web, which contradicts where the
  practice actually lives; risk that "web-first onboarding" silently
  becomes "onboarding never gets the mobile attention it needs."

### Option C — Hybrid: Room 1 on mobile, deeper Rooms on web (Phase 1)
Mobile ships Pre-room + **Room 1 (Arrival)** only; Rooms 2–7 remain
web for Phase 1, explicitly documented as deferred.
- **Pros:** mobile can begin the relationship (Arrival is low-text,
  low-risk — name + presence, minimal free-text) without shipping the
  whole ritual or the seed letter; smallest *delicate-copy* exposure on
  mobile; lets the firebreak mobile-wiring be proven on the simplest Room
  before free-text Rooms; parallelizable with web building 2–7.
- **Cons:** still a seam (Room 1 mobile → Rooms 2–7 web); Room 1 alone
  is not a complete onboarding — the user is "arrived" but not "known";
  hand-off state (resume on web at Room 2) must be designed.

## 4. Recommendation

**Eventual target: Option A.** Mobile is where the journaling happens;
the arrival should not be permanently split.

**Phase 1: Option C, if build speed matters; otherwise go straight to A.**
Rationale: the full 7-room flow is emotionally delicate and currently
unbuilt everywhere. A hybrid lets mobile *begin* the relationship on the
lowest-text, lowest-risk Room while Rooms 2–7 are authored once (web,
where Room 1 and the firebreak reference wiring already exist) and then
brought to mobile as a deliberate Phase 2, not a rushed Phase 1.

Sequencing implied:
1. Mobile Pre-room + Room 1 (Arrival) — minimal/no free-text, no seed
   letter, but **firebreak path wired even here** so the integration is
   proven on the simplest Room.
2. Web builds Rooms 2–7 from the script (incl. the Room 6 skippable
   spiritual question and the Room 7 seed letter — the two most delicate
   surfaces) with full firebreak wiring.
3. Phase 2: bring Rooms 2–7 to mobile (Option A reached), only after the
   copy is settled on web and the firebreak is proven on free-text Rooms.

This explicitly avoids putting the seed letter and the spiritual room on
mobile under Phase-1 time pressure.

## 5. Guardrails (non-negotiable)

- No gamification, streaks, progress bars framed as achievement, "X% to
  go", or "complete your profile" nudging. Rooms are a slow arrival, not
  a funnel.
- No motivational / productivity / self-help framing in any onboarding
  copy. The script is canonical; do not paraphrase it warmer.
- No exclamation points in product copy (project standard).
- Room 6 (spiritual) stays **opt-in and skippable**; subtle, never
  preachy.
- The Room 7 **seed letter** is one of the two sanctioned first-person
  frame-breaks (`voice/character-bible.md`) — its wording is voice-doc
  governed; do not improvise it per-platform.
- **No crisis changes.** Mobile onboarding must route free-text through
  the existing firebreak; it must not add, soften, reword, or re-scope
  crisis behaviour. If a free-text Room cannot yet be screened on a
  fail-closed path on mobile, that Room does not ship on mobile yet.
- No local-only offline persistence of onboarding free-text that could
  sync later unscreened (see §2 dependency). Offline behaviour for
  free-text Rooms is an open design item, not a default.

## 6. Acceptance Criteria

This spec is satisfied when a Phase-1 decision is recorded such that:

- Mobile onboarding **either** fully matches the canonical Rooms in
  `voice/onboarding-script.md`, **or** explicitly enumerates which Rooms
  are deferred, to which platform/phase, and why.
- Every shipped Room matches the script verbatim in intent (no
  platform-specific reworded copy); deferred Rooms are listed, not
  silently absent.
- The crisis-firebreak precondition is stated as a blocking dependency
  for any free-text Room on mobile, with the offline-text question called
  out as unresolved (not defaulted).
- The seed letter and the spiritual room are explicitly identified as
  the delicate surfaces and are not scheduled into a rushed Phase 1.
- No guardrail in §5 is violated by the chosen option.

## 7. What this spec does NOT decide

- It does not write onboarding code, navigation, or copy.
- It does not finalize the mobile↔web hand-off/resume mechanism (Option
  C) — that is a follow-on design item if C is chosen.
- It does not change anything in STEP 4 (crisis), retention, or A2.
- It does not pick the offline-free-text policy; it only forbids the
  unsafe default and flags it for a later, explicit decision.

## 8. Open items → `docs/follow-ups.md` (if a direction is chosen)

- MO-1: mobile↔web onboarding resume/hand-off state (only if Option C).
- MO-2: mobile firebreak wiring for onboarding free-text (depends on the
  STEP 8 integration; must fail closed; do not start until STEP 8 path
  is the reference).
- MO-3: offline behaviour for free-text Rooms on mobile (unresolved;
  blocked on MO-2; default is "do not persist unscreened").
- MO-4: Phase-2 port of Rooms 2–7 to mobile (only after web copy settles).

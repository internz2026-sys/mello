# mellō — Onboarding Script

> The 7 rooms. The first ~15 minutes a user spends with mellō determine whether they'll stay for years.
> Every word here is voice-critical. Read aloud before changing.
>
> Version: 0.2 — 2026-05-16 (mellō reframe — practice, not Thou)

## Design principles

- This is a *conversation*, not a form. The AI speaks in full sentences, the user replies in their own words.
- Each room transitions only when the user is ready. No "Next" button — the AI invites the next question when the previous one feels complete.
- Resumable. Anywhere. Always.
- The user can skip any question. mellō does not insist.
- All raw answers become `journal_entries` (kind=`onboarding`). The first distillation runs that night, producing seed semantic memories.

## Pre-room — the welcome screen

A nearly-blank screen. Center, soft serif:

> **mellō**
>
> *future self — a place to think slowly*

Below, smaller:

> *Take as long as you'd like. Pause anytime.*
>
> [ Begin ]

That's it. No marketing copy. No onboarding tour. The product begins.

---

## Room 1 — Arrival (≈ 2 min)

**Purpose:** The user's first contact with mellō's voice. Set the emotional contract.

### Opening (Companion mode)

> Welcome.
>
> Before anything else — what name do you go by?

`[user enters name]`

> {name}.
>
> This is a place to be known slowly. Nothing said here is shared with
> anyone — you can always change, hide, or delete what you say.
>
> So — what brought you here today?

`[open text — the user writes freely, any length]`

### Follow-up logic

- If the answer is **short or guarded** (< 30 chars):
  > Is there a single feeling underneath it — tired, restless, hopeful, unsure?

- If the answer mentions **a specific person, event, or struggle**:
  > What you named is held here. Nothing needs to be solved tonight.

- If the answer is **about wanting to "improve"** (vague):
  > "Improve" can mean a hundred things. If you knew you wouldn't be judged
  > for it — what would you actually want?

- If the answer is **about hustle/productivity** (red flag):
  > That's one frame. mellō isn't really a productivity tool — it's slower than that.
  > Is there a quieter reason underneath?

### Transition out

> A few more questions, slowly. You can stop anytime.

---

## Room 2 — The Now (≈ 3 min)

**Purpose:** Capture current emotional and life state without sounding clinical.

### Prompts (each shown one at a time, with breathing room)

> Where does life feel off, right now?

`[user writes]`

**Single follow-up, generated from response:**
- If user names a domain (work, money, relationship, faith, health):
  > And underneath the {domain} feeling — what's the deeper thing?
- If user is abstract:
  > One example from this week?

---

> What have you been carrying lately — the kind of thing you don't say out loud at dinner?

`[user writes]`

(No follow-up. Let it sit.)

---

> If you could rest from one thing for a week, what would it be?

`[user writes]`

### Transition

> Thank you. That's enough for one room.
> Something different next.

---

## Room 3 — The People (≈ 2 min)

**Purpose:** Seed the relationship graph. Light, never invasive.

> Who matters most to you, in this season? A few names, however you'd
> say them aloud — no pressure to be exhaustive.

`[user adds up to 5 — name + optional one-line note]`

For each name added, brief optional follow-up:

> What's something you appreciate about {name} — or something that's hard
> right now between you?

(Optional. User can skip per-person.)

---

> Is there someone you've been meaning to be more present with?

`[user writes]`

### Transition

> We'll honor them as we go. mellō will sometimes ask, gently,
> how things are with the people you've named — never to nag, only to
> remind you that they matter.

---

## Room 4 — The Becoming (≈ 3 min)

**Purpose:** Seed the Future Self system — *or* honor that the user doesn't yet have a future self named. Both are first-class. mellō is a vessel, not a method; some people arrive knowing who they're becoming, and some arrive without a name for it yet. Both get walked with.

> What kind of person do you hope to be in 10 years?
>
> Not "what job." Not "what salary."
> Who do you want to be when you look in the mirror at 10 years from today?
>
> *(There is no wrong answer. "I don't know yet" is a complete one.)*

`[user writes — any length, including very short]`

**Follow-up branches (generated from response):**

- If response is **"I don't know yet"**, **"I haven't thought about it"**, **"I'm not sure"**, or otherwise wordlessly open:

  > That's an honest answer. Not-knowing is its own kind of work.
  > Some questions stay open for a while.
  >
  > Is there anything you *don't* want to be? Sometimes what we don't
  > want is easier to name first.

  `[user writes — short or "no" is a complete answer]`

  Then:

  > Is there a season of your life you're walking through right now —
  > with or without a name for it? Loss, transition, waiting, a question
  > that won't leave you alone?

  `[user writes — a single word is a complete answer]`

  *(Persist `future_self_named = false`. The implicit future self gets built quietly from the user's collective lived experience over the coming weeks. Letters arrive later, when there's something to say.)*

- If response is **career-focused**: gently redirect:
  > That's part of it. Beneath the {career thing} — what kind of person?

- If response is **relational**: stay with it:
  > What would that look like on an ordinary Tuesday?

- If response is **vague/aspirational** ("a better version of me"):
  > Better in what way, specifically? What would they do differently than
  > you did this week?

---

*(Only if the user named a future self in their first answer:)*

> What would make that future self proud of today's you?

`[user writes]`

---

> And what would they grieve, if today's habits continued unchanged?

`[user writes — this one is heavy on purpose]`

### Transition

> Hold what you said. mellō will return to it.
> Not to pressure you — but because the person you described is real,
> even if you couldn't name them yet.

---

## Room 5 — The Values (≈ 2 min)

**Purpose:** Anchor the memory engine with explicit values.

### Mode chooser

> Some people know their values like they know their name.
> Some people would rather see a few and choose.
>
> Which feels easier today?

`[I'll write them] [Show me some to choose from]`

### Path A — write them

> What are some of the values you want to live by? A few, in any words
> you'd use yourself.

`[user writes]`

### Path B — card-sort

A soft scrollable list of ~30 values:

`faith, honesty, courage, generosity, family, simplicity, creativity, peace, justice, humility, stewardship, presence, freedom, learning, integrity, beauty, service, patience, joy, rest, truth, friendship, wisdom, kindness, purpose, forgiveness, hope, love, mercy, gentleness`

User taps to select up to 7. The list is gently randomized per user to
prevent ordering bias.

### After either path

> Of those — which one have you been drifting from?

`[user writes]`

(No follow-up. Let it land.)

### Transition

> Thank you for naming that.

---

## Room 6 — The Spiritual Question (≈ 2 min, skippable)

**Purpose:** Set `spiritual_opt_in`. Gate the entire spiritual feature surface.

> One more question, and you can skip it.
>
> Some people walk a spiritual life — prayer, scripture, silence, ritual,
> lament, whatever form it takes. Others don't. mellō can hold either path.
>
> Would you like mellō to gently include that dimension?

`[Yes, please] [Not now] [Never]`

### If "Yes":

> Is there a tradition or text that grounds you?

`[user writes — free text, optional]`

> Thank you. mellō will hold that with care. Anything that surfaces
> here is for your reflection, never for performance.

### If "Not now":

> Understood. You can turn this on anytime in Settings.

### If "Never":

> Got it. mellō won't bring it up. You can change this anytime.

(Persist to `profiles.spiritual_opt_in` and optional `profiles.spiritual_tradition`.)

---

## Room 7 — The Promise (≈ 1 min)

**Purpose:** The first letter. The seed of semantic memory. *This is one of mellō's two intentional frame-breaks (the other is the crisis path). After fifteen minutes of the user giving the practice their stories, the practice introduces itself as a keeper — once, in plain first person — and then returns to practice-voice for everything that follows. See `voice/character-bible.md` — "The two intentional frame-breaks".*

In the background, while the user reads the transition, Claude generates
a ~200-word letter — *mellō's initial understanding of who they are*,
written in the user's likely voice, based on their answers across all rooms.

### Transition

> One more thing.
>
> A short letter, based on what you've said. Read it. Edit anything
> that feels wrong.

### The letter (generated — shaped to what the user actually gave)

The letter is built from the moves below, but **only the ones the user offered material for**. A user who answered every room gets a fuller letter. A user who said "I don't know yet" to the future self, or who barely answered Room 5, gets a shorter one. The template adapts; the user's actual responses determine the shape. **A short letter is honest, not a failure.**

Possible moves, each optional, each tied to what the user actually said:

- A sentence naming what the user is carrying right now *(from Room 2)*
- A sentence naming who matters to them, by name *(from Room 3)*
- A sentence about who they hope to become, in their own framing *(from Room 4) — OR, if they said "I don't know yet": a sentence honoring the not-knowing, naming the season they said they were in*
- A sentence about a value they named and where they said they were drifting from it *(from Room 5)*
- A line acknowledging the spiritual layer being held — *only if they opted in (Room 6)*
- A closing line: *"I won't be perfect at remembering. When I get something wrong, tell me. We'll begin slowly. — mellō"*

#### Example A — user who answered fully

> *Dear {name},*
>
> *Reading what you wrote, here is what I'm beginning to see:*
>
> *{2-3 sentences: current burden, named with care}*
>
> *{2-3 sentences: who they hope to become, in their own framing}*
>
> *{1-2 sentences: a value paired with where they said they were drifting from it}*
>
> *{1 sentence: a person who matters, named, with a line about presence}*
>
> *I won't be perfect at remembering. When I get something wrong, tell me.*
> *We'll begin slowly.*
>
> *— mellō*

#### Example B — user who said "I don't know yet" to the future self

> *Dear {name},*
>
> *Reading what you wrote, here is what I'm beginning to see:*
>
> *{1-2 sentences: current burden, named with care}*
>
> *You said you don't yet know who you're becoming. That is its own
> kind of honesty, and mellō will hold the question open with you.
> {1 sentence about the season they named, if they named one.}*
>
> *{1 sentence: a person who matters, named, with a line about presence}*
>
> *I won't be perfect at remembering. When I get something wrong, tell me.*
> *We'll begin slowly.*
>
> *— mellō*

User can:
- Edit any line
- Strike any line
- Accept

Accepting commits this letter as the seed semantic memory:
`memories(kind='identity', stability='stable', importance=0.9)`

### Exit screen

A nearly-blank screen. Center, soft serif:

> Welcome, {name}.
>
> *When you're ready, begin.*

No "Get started" button. No tour. The home screen quietly awaits.

The first morning prompt will arrive — gently — within 24 hours.

---

## What happens in the background

After Room 7, asynchronously:

1. All room answers stored as `journal_entries`, kind=`onboarding`.
2. The first-letter content stored as `memories` with `kind=identity`, `stability=stable`, `importance=0.9`.
3. The Distiller runs (full pass — not the lightweight nightly version) on all onboarding content.
4. 8–15 initial semantic memories generated and stored in Qdrant.
5. The Future Self generator runs for the 1y / 5y / 10y horizons, producing voice documents.

By the time the user opens the app the next morning, mellō already knows them.

## Resumability

Each room saves on every interaction. If the user closes the app:

- They re-open exactly where they left off.
- mellō says nothing about leaving. No "Welcome back! Let's pick up where..." — just the room as it was.

## What we do NOT ask in onboarding

- Date of birth (only if user opts in via Settings for milestone features)
- Gender, sexuality (only via free pronoun field, if at all)
- Income, job title (we'll learn it if it matters to them)
- Email confirmation prompts mid-onboarding
- App rating prompts. Ever. Not in onboarding, not anywhere.
- Anything that smells like a marketing form

The user is not a lead. They are a person beginning a relationship.

## Crisis handling within onboarding

If at any point the user's answer contains signals of acute crisis (the same
classifier that watches all journal entries), the flow pauses and the
scripted crisis path runs. After the crisis bridge, the user can either
continue onboarding or exit gently — never forced forward.

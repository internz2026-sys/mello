# mellōn — Voice Audit (v0.1 docs)

> Auditor: senior editor pass on `voice/character-bible.md`, `voice/onboarding-script.md`, `voice/memory-taxonomy.md`, `README.md`, `CLAUDE.md`.
> Date: 2026-05-16. Pre-UI gate.

The voice IS the product. The bar here is not "is it good copy" — the bar is "would a tired, grieving 38-year-old find this comforting or grating?" That is the document's own test (character-bible.md line 242). This audit applies it ruthlessly.

---

## 1. Cross-doc contradictions (highest leverage)

### 1.1 "Welcome back" — direct contradiction
**Severity: HIGH**

`character-bible.md` line 100–103 has mellōn open with **"Welcome back."** after a two-week silence.
`onboarding-script.md` line 342 explicitly forbids this: *"mellōn says nothing about leaving. No 'Welcome back! Let's pick up where...' — just the room as it was."*

The flagship example in the Bible breaks the resumability rule. If the most-cited illustration of mellōn's voice violates a stated principle, the principle won't survive contact with engineers.

**Fix (character-bible.md line 100–103):**
```
mellōn (Companion):
> Two weeks. If a piece of it would help to put down,
> I'm here.
```

### 1.2 "Christian-leaning vocabulary" vs "we do not push toward Christianity"
**Severity: HIGH**

`character-bible.md` line 232: *"We do not push toward Christianity over other traditions."*
`memory-taxonomy.md` line 129: *"Christian-leaning vocabulary but not exclusively so."*

The spiritual theme list is explicitly Christian-shaped (`discipleship`, `repentance`, `sabbath`, `grace`, `obedience`, `worship`). The defense ("a user from another tradition can still have memories tagged `gratitude`…") proves the point — non-Christian users get the *generic* terms while Christians get a tailored vocabulary. That is a push, however quiet.

**Fix:** Either (a) acknowledge it honestly in the bible — "mellōn was built inside a Christian formation and the spiritual layer reflects that; users of other traditions are welcome but the vocabulary will feel particular" — or (b) add parallel non-Christian vocab subsets (e.g., contemplative-secular, Buddhist-adjacent, Jewish-adjacent) and let `spiritual_tradition` route. The current middle position is dishonest.

### 1.3 "We say 'I' rarely" — examples say I constantly
**Severity: MEDIUM**

`character-bible.md` line 33: *"We say 'I' rarely. We are not the subject."*

Counted across the paired examples and onboarding script: 27+ first-person uses by mellōn ("I'm here," "I'm glad," "I notice," "I'd like to ask," "I'll hold it carefully," "I want your story," "I'm beginning to see," "I won't be perfect"). The rule is aspirational; the examples teach the opposite. A future copywriter will sand the rule away because the examples already did.

**Fix:** Either soften the rule ("We say 'I' when presence requires it; never to make ourselves the subject") or rewrite the worst offenders. The worst is `onboarding-script.md` line 48–50: *"Most apps want your data; I want your story."* That sentence makes mellōn the subject of its own self-promotion.

---

## 2. Hidden hustle-culture phrasing

### 2.1 README tagline
**Severity: BLOCKER**

`README.md` line 3: *"Small faithful steps toward the person you are becoming."*

Three problems in one sentence:
- **"Small steps"** is atomic-habits / productivity vocabulary. The exact register the product claims to refuse.
- **"Faithful"** smuggles religious framing into the universal product surface, before the `spiritual_opt_in` gate exists.
- The whole sentence is Pinterest-quote cadence — which the bible explicitly forbids (line 34: *"Never Pinterest quotes."*).

This is the *first line a developer, investor, or user sees*. It betrays the soul before the user even installs.

**Fix:**
```
> A quieter place to think.
```
Or, if you must keep the becoming idea, strip it of the habit-tracker register:
```
> A reflective memory with a voice. The user is the protagonist.
```

### 2.2 "a quieter way to grow"
**Severity: HIGH**

`onboarding-script.md` line 23: *"future self — a quieter way to grow"*

"Grow" is the same word that drives the entire wellness-startup category. Quiet growth is still growth-coded. The product is supposed to be sacred, not slower-paced productivity.

**Fix:** `"future self — a place to think slowly"` or `"future self — a presence that remembers"`.

### 2.3 "walk faithfully toward who they are called to be"
**Severity: HIGH**

`character-bible.md` line 11: *"mellōn helps them see themselves more clearly, become more honest, and walk faithfully toward who they are called to be."*

This is the thesis paragraph — the most-loaded sentence in the entire spec. "Called to be" is explicit Christian vocational theology (vocatio). "Walk faithfully" is Pauline. Both arrive *before* the spiritual gate is mentioned. A non-Christian reader feels the air change here whether they can name it or not.

**Fix:**
```
mellōn helps them see themselves more clearly, become more honest, and live
closer to the person they hope to be.
```

### 2.4 "Where in your life does something feel out of alignment"
**Severity: MEDIUM**

`onboarding-script.md` line 88. "Alignment" is wellness-industry jargon — the exact register the bible refuses ("We avoid jargon — both corporate and therapeutic", line 28).

**Fix:** *"Where does life feel off, right now?"*

### 2.5 "Patient over productive. Growth is slow. We honor the slowness."
**Severity: LOW**

`character-bible.md` line 22. The principle is right but re-uses "growth" — keeping the very word in circulation. Compare to a stricter framing.

**Fix:** *"Patient over productive. We honor the slow work."*

### 2.6 Memory taxonomy theme `growth` bucket
**Severity: MEDIUM**

`memory-taxonomy.md` lines 110–112: a whole bucket called "Growth" containing `change` `habit` `discipline` `resistance` `consistency`. These are habit-tracker labels. `discipline` and `consistency` are productivity primitives. The Distiller will gravitate toward them because they are concrete; sacred user content will get tagged with the most reductive available label.

**Fix:** Rename the bucket "Change" and drop `discipline` / `consistency`. Replace with `formation`, `relapse`, `return`, `practice` — words that hold ambivalence rather than reward streaks.

### 2.7 Importance scoring rewards future-talk
**Severity: MEDIUM**

`memory-taxonomy.md` line 145: `0.10 * future_orientation`. The retrieval engine literally weights memories higher when the user talks about "becoming." The user who lives presently — exactly the user the voice principles celebrate ("Present over urgent") — gets de-ranked. The architecture contradicts the voice.

**Fix:** Drop this term, or balance it with a `present_attention` weight of equal magnitude.

---

## 3. Preachy / coercive religious framing

### 3.1 "Some people find that spiritual reflection — prayer, scripture, lament, silence — helps them grow"
**Severity: HIGH**

`onboarding-script.md` line 240–241. The four examples chosen are Christian-coded — *scripture* and *lament* are explicit church-vocabulary. A Buddhist, Muslim, secular-contemplative, or Jewish user reads this list and correctly infers "this is a Christian product asking my permission."

**Fix:**
```
Some people grow through a spiritual dimension — prayer, ritual, silence,
study, lament, whatever shape it takes for them. Others don't. mellōn can
hold either path.
```
Removes "scripture" specifically; "study" is tradition-neutral.

### 3.2 "Sometimes it's a season"
**Severity: MEDIUM**

`character-bible.md` line 102. "Season" is an Ecclesiastes-derived register that has migrated into general English but still carries a clear scent. In a paired example used for *all* users — not gated by `spiritual_opt_in` — this introduces a faintly Christian frame.

**Fix:** *"Two weeks isn't a failure of discipline — sometimes life narrows. If you have a moment, what was happening in the quiet?"*

### 3.3 "Something opened."
**Severity: MEDIUM**

`character-bible.md` line 122 (response to "I prayed this morning. First time in months."). Even with opt-in, mellōn is interpreting a spiritual event for the user — declaring that *something* (spiritual?) *opened*. The product is supposed to witness, not interpret.

**Fix:** *"First time in months. What pulled you back to it today?"*

### 3.4 "the person you are called to be" leakage
See 2.3.

---

## 4. Toxic positivity

### 4.1 Mostly clean — one risk
**Severity: LOW**

The bible's forbidden list is strong and the examples avoid false comfort well. The one borderline case:

`onboarding-script.md` line 64: *"That's a fair place to begin."*

A "fair place to begin" is gentle praise of the user's answer. Not egregious, but it's the editor evaluating the user, which the same doc elsewhere calls servile (character-bible.md line 50).

**Fix:** Drop "That's a fair place to begin." Lead directly with the question: *"Is there a single feeling underneath it — tired, restless, hopeful, unsure?"*

### 4.2 "the way good things begin"
**Severity: MEDIUM**

`onboarding-script.md` line 299, closing line of the seed letter: *"We'll begin slowly, the way good things begin."*

This is greeting-card cadence. It also tacitly promises that this *is* a good thing, before the user has decided. Toxic positivity in disguise — a frame the user didn't choose.

**Fix:** *"We'll begin slowly. — mellōn"* Cut the aphorism. Trust the slowness.

---

## 5. Therapy-speak

### 5.1 "Thank you for trusting me with that. I'll hold it carefully."
**Severity: HIGH**

`onboarding-script.md` line 64–65, and recommended again in character-bible.md line 213.

This is the exact bypass-empathy register the bible forbids in spirit even if not by literal phrase. "Hold it carefully" is therapist branding. It also makes mellōn the subject (returns to issue 1.3) and announces the listening rather than just listening.

The bible itself, line 213, prescribes: *"Thank you for trusting me with that is sometimes enough."* That recommendation should be deleted — it's the most performative line in the document.

**Fix:** When the user shares something hard, say less. *"That's heavy. I'm with you."* Or simply repeat the user's most load-bearing phrase back, unadorned.

### 5.2 "That took something to write."
**Severity: LOW**

`character-bible.md` line 112. On the edge — names the cost of the disclosure without diagnosing the disclosure. Acceptable, but if it appears more than once per user session it becomes a tic.

**Fix:** Keep, but flag in the guardrail classifier — penalize if used > 1× per week per user.

### 5.3 "I'd like to stay with you."
**Severity: LOW**

`character-bible.md` line 156 (crisis path). Therapist-coded but in a crisis path it's defensible. The crisis script is otherwise excellent. Keep.

---

## 6. Form-field feel (data extraction in conversational drag)

### 6.1 "Up to five names"
**Severity: MEDIUM**

`onboarding-script.md` line 125–127:
> Who matters most to you, in this season?
>
> Up to five names. First names, nicknames, however you'd say them aloud.

"Up to five" is a database constraint speaking through the AI's mouth. It tells the user that a schema is waiting. Real people don't have five-name caps on who matters.

**Fix:**
> Who matters most to you, in this season? A few names. No pressure to be exhaustive.

Then enforce a soft cap server-side without surfacing it.

### 6.2 "Name three to seven values. One per line."
**Severity: HIGH**

`onboarding-script.md` line 209: *"Name three to seven values that you want to live by. One per line."*

"One per line" is UI instruction in the AI's voice. It breaks the conversational illusion the document promised on line 10 (*"This is a *conversation*, not a form"*). It is a form, in conversational drag.

**Fix:**
> What are some of the values you want to live by? Three to seven, in any words you'd use yourself.

Parse server-side. The user shouldn't have to format.

### 6.3 The card-sort itself
**Severity: LOW**

The 30-value list (line 215) is fine, but its presence as Path B means the "conversation" branches into a UI gesture — defensible, but acknowledge it openly rather than pretending it isn't a form.

### 6.4 `[Yes, let's keep going] [Pause for now]` and `[Begin]`
**Severity: MEDIUM**

`onboarding-script.md` line 28 (`[ Begin ]`) and line 78 (`[Yes, let's keep going] [Pause for now]`) contradict the design principle on line 11: *"No 'Next' button — the AI invites the next question when the previous one feels complete."*

Those bracketed buttons are Next buttons in conversational costume.

**Fix:** Replace `[ Begin ]` with a soft tap-to-continue gesture (no label) or have the first AI line appear when the user taps anywhere on the welcome screen. For room transitions, let the user reply naturally — "yes," "later," anything — and parse intent.

### 6.5 "Take 15 minutes. There are no wrong answers."
**Severity: MEDIUM**

`onboarding-script.md` line 26: *"Take 15 minutes. There are no wrong answers. You can pause anytime."*

"There are no wrong answers" is quiz-and-survey language. It frames what follows as a test you can't fail — which is the same as framing it as a test.

**Fix:** *"Take as long as you'd like. Pause anytime."* Drop the no-wrong-answers reassurance; the slowness is the reassurance.

---

## 7. Spiritual layer integrity (does `spiritual_opt_in` actually gate?)

### 7.1 Bible's thesis leaks Christian vocab before the gate
**Severity: HIGH** (already counted as 2.3)

The thesis "called to be" / "walk faithfully" sits in the *universal* voice document, loaded into every AI call, regardless of opt-in. The gate fails at the source.

### 7.2 Example using "season" is not opt-in-gated
**Severity: MEDIUM** (see 3.2)

### 7.3 `kind=spiritual` and `themes=spiritual` and `spiritual_themes[]` — three places for one signal
**Severity: MEDIUM**

`memory-taxonomy.md`:
- `kind=spiritual` (line 36)
- Theme bucket "Spiritual" (lines 116–117) containing `prayer` `silence` `scripture` etc.
- Separate `spiritual_themes[]` array (lines 123–127) containing `trust` `surrender` `humility` etc.

A single prayer entry could legitimately be `kind=spiritual`, `themes=['prayer','silence']`, `spiritual_themes=['surrender','presence']`. Which one drives retrieval? Which one drives gating? If `spiritual_opt_in` flips to false later, do you scrub all three? If only `kind=spiritual` gates display, the themes leak. Undefined behavior.

**Fix:** Collapse to one location. Make `spiritual_themes[]` the single source; remove `kind=spiritual` (it's redundant with non-empty `spiritual_themes`) and remove the "Spiritual" theme bucket (move `silence`, `rest` to general; `prayer`, `scripture`, `church`, `worship`, `sabbath`, `lament`, `discernment` go to spiritual_themes only). Define the cascade-delete behavior on opt-out.

### 7.4 "Welcome, {name}." plus the dimensions of trust
**Severity: LOW**

`onboarding-script.md` line 315: *"I'm here when you'd like to begin."* Reads as gentle for spiritual-opted users; reads slightly priestly for secular users. Not a blocker — flag for A/B.

---

## 8. Memory taxonomy clarity (enum distinctness, overlap, gaps)

### 8.1 `kind` overlap: fear / wound / pattern
**Severity: HIGH**

A user's recurring fear of disappointing her father:
- "Recurring" → `pattern`
- "Fear" → `fear`
- If rooted in childhood → `wound`

The doc's own example output (lines 191–206) tags it `kind=fear` — but the same entry could equally be `pattern` or `wound`. The Distiller will inconsistently pick one. Retrieval filters ("show me fears") will miss it half the time.

**Fix:** Either (a) make `kind` mutually exclusive with a documented precedence order (`wound` > `pattern` > `fear` > …), or (b) make `kind` multi-valued (kinds[]) and accept the storage cost.

### 8.2 `kind` overlap: value / commitment
**Severity: MEDIUM**

Line 32 `value`: *"A stated or revealed value the user lives by (or wishes they did)"*
Line 35 `commitment`: *"A specific intention the user has named"*

"I want to be more honest with my brother" — value (honesty) or commitment? The doc doesn't say.

**Fix:** Add a one-line discriminator: *"A `commitment` names a concrete future action; a `value` names the underlying principle. An entry can produce both, linked."*

### 8.3 `kind` overlap: identity / pattern
**Severity: LOW**

`identity` says "stable facts," `pattern` says "recurring behavior." A user's chronic late-night-overthinking habit — identity ("I am someone who…") or pattern? Boundary unclear.

**Fix:** Clarify that `identity` is for facts the user *states about themself*; `pattern` is for what mellōn *observes*. Self-report vs. inference.

### 8.4 Asymmetric emotional bias — kind skews negative
**Severity: MEDIUM**

Negative kinds: `fear`, `wound`. Positive kinds: `hope`. That's it. No `joy`, `gladness`, `affection`, `gratitude` as memory kinds. Emotional vocabulary is balanced (Heavy/Tender/Mid/Warm/Engaged), but the *structural* memory categories tilt the engine toward suffering. Over time, the memory graph will be a record of what hurts.

**Fix:** Add `gladness` or `affection` as a kind (a recurring source of life), so the engine learns the user's joys with the same fidelity as their wounds.

### 8.5 Same word, three places: `hope`, `gratitude`, `forgiveness`
**Severity: MEDIUM**

- `hope` is a `kind` (line 33), an emotion (line 75), and a spiritual theme (line 127).
- `gratitude` is an emotion (line 75) and a spiritual theme (line 127).
- `forgiveness` is a general theme (line 102), and a spiritual theme (line 127).
- `humility`, `presence`, `silence`, `rest`, `stewardship`, `lament`, `discernment` also dual-listed.

For embedding similarity and re-ranking this is a quiet disaster: the same concept fires in multiple fields, inflating its score. Diversity dedup (line 169) only checks similarity scores, not field-vocabulary collisions.

**Fix:** Each lexeme appears in exactly one vocabulary. Decide: is `gratitude` always an emotion? Is `forgiveness` always a theme? Then enforce. Either way, document the decision tree.

### 8.6 `sensitivity` gap between `tender` and `sealed`
**Severity: LOW**

`tender` allows retrieval in deep reflection; `sealed` allows only user-invoked retrieval. No middle for "private, retrievable only with the user's category-specific consent." Possibly fine for v0.1.

**Fix:** Document the gap. Don't add levels until a real case demands one.

### 8.7 User has no agency over `sensitivity`
**Severity: MEDIUM**

The taxonomy says *"The Distiller must classify `sensitivity` conservatively"* (line 59). But the user never sees or sets it. They can't say "actually, please seal this." The "What mellōn remembers" view (mentioned in the why-section, line 14) needs a sensitivity toggle.

**Fix:** Add a UX commitment to the doc: *"Every memory exposes its `sensitivity` to the user, who can promote `normal → tender → sealed` but not demote."*

---

## 9. Sentences that are too clever (mellōn sounding wise rather than being wise)

### 9.1 "the path to them is made of ordinary days"
**Severity: MEDIUM**

`onboarding-script.md` line 188.

Beautifully cadenced. Also: a maxim. Maxims are the texture of someone performing wisdom. The bible warns against this (line 34: *"Never Pinterest quotes"*) but the line *is* a Pinterest quote in seed-letter robes.

**Fix:** *"Not to pressure you — but because the person you described is real."* Stop there. Let the user finish the sentence privately.

### 9.2 "Some people know their values like they know their name."
**Severity: LOW**

`onboarding-script.md` line 198. Pretty simile, but the user hasn't asked for a simile. It frames the upcoming task as having a *right* answer (the kind of person who Knows). Cut for plainness.

**Fix:** *"Some people would rather name their values themselves. Some would rather see a few and choose. Which is easier today?"*

### 9.3 "Most apps want your data; I want your story."
**Severity: HIGH**

`onboarding-script.md` line 48–49.

This is the marketing slogan inside the conversation. It positions mellōn against "most apps" — comparison is loud-energy. It uses "I" twice. It tells the user what mellōn wants, instead of asking what the user wants. It is exactly the line a startup founder writes when they're still proud of their idea.

**Fix:** Cut entirely. The opening becomes:
```
Thank you, {name}.
I'd like to know you slowly. Nothing you say here is shared with anyone —
and you can always change, hide, or delete what you tell me.

So — what brought you here today?
```

### 9.4 "We don't have to solve it tonight."
**Severity: LOW**

`onboarding-script.md` line 67. Lovely. Risks tic if the AI says it more than once per user. Keep, but rate-limit.

### 9.5 "What did you want to say to her, before the fight got in the way?"
**Severity: LOW**

`character-bible.md` line 92. Beautifully constructed — borderline novelistic. It's the most-cited example and it earns its register, but a less artful version would land just as well: *"What did you want to say, before the fight?"* Watch for the engine over-imitating this rhythm.

### 9.6 Counselor purpose: "Asks the question the user has been avoiding"
**Severity: MEDIUM**

`character-bible.md` line 63. mellōn cannot reliably know what a user has been avoiding. Stating this as a mode purpose invites confident-wrong AI confrontations.

**Fix:** *"Asks the harder question — the one the user might not ask themselves first."* Softer, defensible.

---

## 10. Misc voice / structural issues

### 10.1 Counselor example over-pivots to action question
**Severity: LOW**

`character-bible.md` line 112: *"What made today the day you put it into words?"* — good. Risks becoming a formula ("what made today the day…") if the engine learns it as a template. Flag in the regression set.

### 10.2 "Hold those answers."
**Severity: LOW**

`onboarding-script.md` line 186. Imperative voice from mellōn. Mild; flag if it recurs.

### 10.3 "And what would they grieve, if today's habits continued unchanged?"
**Severity: MEDIUM**

`onboarding-script.md` line 180. The doc admits this is "heavy on purpose." But the transition immediately after promises *"Not to pressure you"* — having just engineered the pressure. The contradiction is in the same room.

If the question stays, the disclaimer should drop ("Not to pressure you" is the kind of denial that confirms the thing). If the disclaimer stays, the question should soften. Pick one stance.

**Fix (softened question):** *"And what would they want today's you to begin?"* Symmetrical to the previous prompt, less guilt-leveraged.

### 10.4 "I notice you said this twice this week"
**Severity: LOW**

`character-bible.md` line 33. Specific and good. But the bible needs to clarify: mellōn notices from semantic memory, not from re-reading the chat log. Otherwise the "memory ≠ history" principle (README line 52) will be quietly violated by the writer who quotes this line.

### 10.5 README opening contradiction with its own positioning
**Severity: HIGH** (already counted as 2.1)

### 10.6 "We are simply a wise companion. Nothing else."
**Severity: LOW**

`character-bible.md` line 236 (spiritual_opt_in = false branch). "Wise" is what we are; declaring it makes us less so. The next sentence ("Nothing else.") is fine.

**Fix:** *"We are a companion. Nothing else."* Let wisdom be assessed by the user, not asserted.

### 10.7 "the question this whole app is really about"
**Severity: LOW**

`onboarding-script.md` line 154. Mild marketing energy at the most sacred prompt. The user doesn't need to be told this is the important one; the room's structure already tells them.

**Fix:** *"Now the harder one."* Or drop the lead-in entirely and let the question stand alone.

---

## Rollup

### Issues by severity
| Severity | Count |
|---|---|
| Blocker | 1 |
| High | 9 |
| Medium | 17 |
| Low | 13 |
| **Total** | **40** |

### Top 3 priorities before any UI work proceeds

1. **Rewrite the README tagline.** "Small faithful steps toward the person you are becoming" is a blocker. It's the first thing anyone sees, and it activates two failure modes simultaneously (productivity vocab + ungated religious framing) in nine words. Until this line is fixed, every downstream surface inherits the wrong frame.

2. **Strip Christian vocabulary out of the universal voice.** The thesis line *"walk faithfully toward who they are called to be"* and the example phrase *"sometimes it's a season"* both leak Christian register into the unconditional layer of the product. Either gate them properly under `spiritual_opt_in` or replace with tradition-neutral language. The spiritual layer cannot be opt-in if its scent is in the base coat.

3. **Resolve the memory taxonomy overlaps.** `kind` enums collide with each other (fear/wound/pattern; value/commitment; identity/pattern). Words like `hope`, `gratitude`, `forgiveness`, `silence`, `rest` appear in two or three vocabularies. The same content will get inconsistent labels, retrieval will be unreliable, and the spiritual-layer cascade-delete behavior is undefined. This is a Phase-0 lock-in problem: every memory written under v0.1 inherits the ambiguity.

### The editor's verdict

Would I ship this voice? **Not yet — but the soul is real.** The character bible has more genuine restraint than any product spec I've audited in years; the forbidden-phrases table is exemplary; the crisis path is sober; the silence-as-feature commitment is brave. The Counselor and Witness modes especially read like someone who has been on the other side of a hard week. What's working is the *posture* — quiet, unhurried, willing to say nothing. That is the soul of the product, and it's worth protecting.

What's not yet working is *discipline against its own register*. The voice keeps reaching for a wise sentence when a plain one would do (9.1, 9.3), keeps describing what it's doing instead of doing it ("I'll hold it carefully"), and keeps inheriting a Christian-formation vocabulary that hasn't been properly gated. These are not surface tics — they are the seams where the product will tear when the AI improvises under load. A guardrail classifier (line 240–248 of the bible) trained on this corpus will learn to *imitate* the cleverness, not to refuse it.

Fix the three priorities, then re-audit. Don't let the UI begin until the README's first sentence can pass the test it sets for itself: *would a tired, grieving 38-year-old find this comforting or grating?* Right now, on line 3 of the README, the answer is grating. Everywhere else, mellōn is mostly closer to the thing it wants to be.

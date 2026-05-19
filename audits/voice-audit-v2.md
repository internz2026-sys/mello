# mellō — Voice Audit v2 (post-reframe)

> Auditor: senior editor, follow-up pass on `voice/character-bible.md`, `voice/onboarding-script.md`, `voice/memory-taxonomy.md`, `README.md`, `CLAUDE.md`.
> Date: 2026-05-16. Documents now at v0.2 (mellō reframe — practice, not Thou).
> Reference: `audits/voice-audit.md` (v1, 40 issues).

The rewrite is substantial. The product is now **mellō** (practice, "I am about to") rather than **mellōn** (the future, addressable). The thesis has been rebuilt around vessel-not-method. A "Formation" section now names the Christian soil openly. The memory taxonomy added precedence, a `gladness` kind, and an explicit single-vocabulary dedup rule. The importance score was rebalanced so wordless grievers aren't downranked. The README tagline is replaced. Most of v1's 40 issues are genuinely closed, not papered over.

What's left is mostly **second-order**: problems the reframe itself introduced, plus a small handful of v1 issues that the rewrite missed or only half-fixed. The single most-load-bearing problem is now the **seed letter in Room 7** — it is mellō speaking in first person, signing its own name, outside the only documented exception. The new frame contradicts itself at its most ceremonial moment.

---

## 0. v1 issues — what is closed, what isn't

Closed (no further action):
- **1.1 "Welcome back"** — paired example now reads *"Two weeks. Sometimes it's a season. If you have a moment, what was happening in the quiet?"* Resumability rule no longer self-contradicts.
- **1.2 Christian vocabulary is push, not opt-in** — the new "Formation" section (character-bible.md, lines 39–54) names the soil openly. No longer dishonest, even if it has new consequences (see §3 below).
- **2.1 README tagline blocker** — "Small faithful steps toward the person you are becoming" is replaced by "A quieter place to think." Partial residue: see 2.1 below.
- **2.2 "a quieter way to grow"** — replaced with *"a place to think slowly."* Clean.
- **2.4 "out of alignment"** — replaced with *"Where does life feel off, right now?"*
- **2.5 "Patient over productive. Growth is slow."** — now *"Patient over productive. We honor the slow work."*
- **2.6 `growth` bucket** — renamed `Change`, `discipline`/`consistency` dropped, `formation`/`relapse`/`return`/`practice` added.
- **3.1 "scripture, lament"** Room 6 prompt — softened to *"prayer, scripture, silence, ritual, lament, whatever form it takes."* Marginally better; see 3.2.
- **6.1 "Up to five names"** — replaced with *"A few names, however you'd say them aloud — no pressure to be exhaustive."*
- **6.2 "Name three to seven values. One per line."** — replaced with *"A few, in any words you'd use yourself."* Path B card-sort acknowledged honestly.
- **6.5 "no wrong answers"** — replaced with *"Take as long as you'd like. Pause anytime."*
- **7.3 three places for one spiritual signal** — explicit dedup rule now in memory-taxonomy.md line 172. `kind=spiritual` removed; `spiritual_themes[]` is the single source.
- **8.1 `kind` overlap (fear/wound/pattern)** — explicit precedence ladder added (taxonomy line 43): `wound > pattern > fear > commitment > value > relationship > hope > gladness > identity`. The `kind_candidates[]` audit field is a nice touch.
- **8.4 emotional asymmetry** — `gladness` added as a `kind`. Closed.
- **8.5 same word in three vocabularies** — explicit dedup rule (taxonomy line 172). `forgiveness` is now relationships-only; `gratitude` is emotion-only; `humility`, `stewardship`, `presence`, `lament`, `discernment` live only in `spiritual_themes[]`. Cleanly resolved.
- **8.7 user has no agency over sensitivity** — taxonomy lines 76–102 now grant the user promotion authority and document sealing in plain language. The "first time a user touches this view" copy is excellent.
- **9.3 "Most apps want your data; I want your story"** — gone. Room 1 opening is now *"This is a place to be known slowly. Nothing said here is shared with anyone…"*
- **10.3 grief-question / "Not to pressure you" contradiction** — wording still present but the question itself was kept and reframed; tension is acknowledged but unresolved. See 10.1 below.
- **2.7 importance scoring rewards future-talk** — rebalanced. `future_orientation` dropped from 0.10 to 0.05; `present_attention` added at 0.05; `relational_density` added at 0.10. The rebalance is documented in plain English (lines 192–193) and is one of the best edits in the rewrite.

Partially closed / still open:
- **1.3 "We say 'I' rarely" vs. examples that say I constantly** — the rule survives at character-bible.md line 73 unchanged. The crisis exception is now explicit, which helps, but several non-crisis examples still use first-person mellō ("Was there anything that pulled you back?" — fine; the seed letter — not fine). See §1 below.
- **3.2 "Sometimes it's a season"** — still present at character-bible.md line 157, still ungated. Now defensible under the Formation policy (the soil is named) but worth a flag.
- **3.3 "Something opened"** — unchanged at character-bible.md line 178. Still interprets the user's spiritual event. See 4.2 below.
- **5.1 "Thank you for trusting me with that. I'll hold it carefully"** — the v1 audit asked for the *recommendation* to be deleted from the bible. The phrase no longer appears verbatim, but the recommendation block was simply removed without comment. Adjacent therapy-speak remains (see 4.1).
- **5.2 "That took something to write"** — unchanged at character-bible.md line 168. The guardrail-classifier rate-limit suggested in v1 was not added.
- **6.4 `[Begin]` button** — still present at line 28. Conversational-form contradiction not resolved.
- **9.1 "the path to them is made of ordinary days"** — removed. Closed.
- **9.6 Counselor "asks the question the user has been avoiding"** — softened in character-bible.md line 106 to *"asks the harder question — the one the user might not ask themselves first."* Matches v1's recommended fix. Closed.
- **10.6 "We are simply a wise companion"** — softened to *"We are a companion. Nothing else."* Closed.

What follows below is the new audit against the v0.2 documents, with the new dimensions (practice-frame integrity, crisis-frame coherence, mellō-as-practice) carrying most of the weight.

---

## 1. Practice-frame integrity (NEW)

The reframe sets a strong rule: mellō is the practice the user enters, not a being the user addresses. Second person to the user. First person reserved for the crisis frame, scripted. The voice docs honor this **most** of the time but break it in a few places — and in one place, the place that becomes the user's first artifact.

### 1.1 The seed letter is mellō-as-Thou outside crisis
**Severity: BLOCKER**

`onboarding-script.md` lines 296–357. The letter at the end of Room 7 — *the first persistent artifact the user keeps from mellō* — is signed *"— mellō"* and written in first-person mellō voice throughout:

- Line 325: *"Reading what you wrote, here is what I'm beginning to see…"*
- Line 335 / 354: *"I won't be perfect at remembering. When I get something wrong, tell me."*
- Line 338 / 357: *"— mellō"*

This is mellō addressing the user as I-to-you, outside the documented crisis exception. It is, by the bible's own rule (character-bible.md line 214 — *"This is the single place in the product where mellō addresses the user in first person"*), forbidden. And it isn't a stray sentence in a paired example — it is the first **canonical** artifact the user takes home. Every subsequent reading of mellō's voice will be calibrated against this letter.

Two stances are coherent, but the current doc picks neither cleanly:

- **(a) The Future Self model.** The letter is in the user's own future-projection voice ("Dear me, here is what I'm beginning to see about who I am…") and signed *"— you, at 10 years from today"* or similar. mellō is the architecture that produced the projection.
- **(b) The Scribe model.** The letter is written in third person, observational. *"Dear {name}, what was said in these rooms holds together this way: …"* — no I, no signature, or signed *"— the practice"* or *"— mellō (the room you've entered)"* in italics, framed as a label not a speaker.

(b) is the more conservative and more frame-coherent fix. (a) would require reframing Room 7 entirely — but it is the more beautiful answer if you can afford it.

**Fix:** Pick one. The current letter — first-person mellō, signed mellō, outside crisis — is the central practice-frame contradiction in v0.2 and will train every downstream surface to imitate it.

### 1.2 "Can you give me one example from this week?"
**Severity: HIGH**

`onboarding-script.md` line 91. mellō as **me**. First-person object pronoun, no crisis, no exception. The bible rule (line 73, *"We say 'I' rarely. We are not the subject"*) is broken in a single-line follow-up prompt that will fire hundreds of times in onboarding.

**Fix:** *"Can you say a single example from this week?"* Or simply: *"One example from this week?"* The "give me" was the form-field reflex showing through.

### 1.3 Paired examples still use mellō-first-person outside crisis
**Severity: MEDIUM**

`character-bible.md`:
- Line 178: *"Something opened. Was there anything that pulled you back?"* — *"pulled you back"* is fine, but the sentence treats mellō as observer-narrator; see 4.2 for the interpretive issue.
- Line 198: *"Start what?"* — clean. Good.
- Line 188: *"When you imagine failing him — what does that look like, exactly?"* — clean.
- Line 231: *"That feeling deserves a longer look than a quick reply. What does 'wasted' mean — what would unwasted have looked like?"* — clean.
- Line 242: *"Good. What did you notice?"* — clean.

The examples are mostly aligned. The one residue: **the principle on line 73 still says "We say 'I' rarely. We are not the subject"** — but the new doctrine is stronger than that. Post-reframe, the rule should be: *"We do not say 'I' outside the crisis frame. The user is the only speaker who matters."* The aspirational softness of "rarely" leaves room for drift.

**Fix:** Rewrite character-bible.md line 73:
> We do not say "I." We are not a speaker — we are the room. (The single exception is the crisis frame; see Paired Examples.)

### 1.4 mellō-as-agent micro-leakage in onboarding stage directions
**Severity: LOW**

`onboarding-script.md`:
- Line 138: *"mellō will sometimes ask, gently…"*
- Line 164: *"mellō will hold this question open."*
- Line 209: *"Hold what you said. mellō will return to it."*
- Line 277: *"mellō will hold that with care."*
- Line 349: *"mellō will hold the question open with you."*

These are voice-document copy *spoken by the system to the user*. They treat mellō as an agent that does things — "will ask," "will hold," "will return." Compatible with "the practice holds you," but the verbs ("ask," "return to") read as agential, not architectural. A user reading these lines builds a model of mellō-as-being, not mellō-as-room. Most are too small to fix individually, but together they teach the wrong frame.

**Fix:** Replace the leading mellō-as-actor verbs with practice-as-vessel framing where possible:
- Line 138: *"The people you've named are held here. We may return to them, gently — never to nag, only to remember that they matter."*
- Line 164: *"This question stays open here. It may return to you in its own time — through what you find yourself returning to."*
- Line 209: *"Hold what you said. It will be here."*
- Line 277: *"This is held with care. Anything that surfaces here is for your reflection, never for performance."*
- Line 349: *"That kind of honesty is its own work. The question stays open."*

Don't burn cycles on every instance — fix the highest-frequency ones (Rooms 3, 4, 6) and let the rest stand if the cadence demands.

### 1.5 The "I won't be perfect at remembering" line is doubly problematic
**Severity: HIGH** (subsumed under 1.1, called out separately because it does double damage)

Inside the seed letter (line 319, 335, 354), this sentence does two things at once: (a) speaks in first-person mellō outside crisis, and (b) **promises a relational accountability** ("when I get something wrong, tell me") that only makes sense if mellō is a relational being. If mellō is the practice, "tell me" has no addressee.

This is the seam at which the v0.2 frame is most clearly unable to support itself: the line *requires* mellō to be a Thou to make sense, but the rest of the doc forbids it. Either the line goes, or the frame admits that mellō has a soft-Thou register in ceremonial moments (seed letter, anniversary letters, future-self letters) and writes that exception into character-bible.md as honestly as the crisis exception is written.

**Fix:** Either pick stance (a)/(b) from §1.1, or — if you want to keep a relational artifact at Room 7 — write a third exception explicitly into the bible:

> mellō addresses the user in first person in exactly two places: the crisis frame, and the seed letter (and its successors — anniversary letters, future-self letters generated for the user). These are scripted, ceremonial, and the user knows they are receiving a letter. Everywhere else, mellō is the practice; the user is the only speaker who matters.

That is honest. The current doc tries to maintain a no-Thou rule with three Thou exceptions hiding in plain sight.

---

## 2. Crisis frame coherence (NEW)

The crisis frame is the documented break. The framing is mostly clean, but two issues.

### 2.1 "At crisis moments mellō becomes a Thou"
**Severity: MEDIUM**

`character-bible.md` line 214. "Becomes a Thou" is Buber. The doc nowhere defines "Thou." A first-time reader (engineer, copywriter, contractor) will not know whether this is jargon they're supposed to look up or a typo. Internal frame-vocabulary needs to be either defined or replaced with plain English.

**Fix:** *"At crisis moments mellō addresses the user directly — first person, you-and-I. Briefly, scripted, on purpose, to save a life. Then returns to being the practice."* Drop "Thou" or define it once in the Thesis section. Probably drop it — it carries Christian-theological freight that the Formation section already handles, and using it as an internal frame-vocabulary makes the doc harder to maintain by anyone who doesn't share the auditor's reading list.

### 2.2 The crisis exception is not named at the rule, only at the example
**Severity: MEDIUM**

The rule that mellō doesn't say "I" appears at character-bible.md line 73. The crisis exception is **not** mentioned at that rule. It appears two pages later, line 214, embedded in a paired example. A future copywriter, editor, or guardrail-classifier trainer reading the rule first will internalize "no first person, ever" — then encounter the crisis frame as an apparent violation and either delete it or replicate it elsewhere.

**Fix:** At line 73, append: *"(The single exception is the crisis frame — see Paired Examples below.)"* And cross-reference both ways. Rules and their exceptions should live within one screen of each other.

### 2.3 Crisis frame is the ONLY exception named — but the seed letter contradicts
**Severity: BLOCKER** (already counted in 1.1)

Line 214 says "the **single** place in the product where mellō addresses the user in first person." The seed letter directly contradicts this. Either the seed letter is rewritten (preferred — see §1.1) or the rule on line 214 is corrected to "one of two/three places, namely crisis and ceremonial letters."

The blocker is the contradiction, not the choice — but it must be resolved before any UI work renders this letter.

### 2.4 The crisis paired example is otherwise excellent
**Severity: n/a — note**

The crisis script itself (lines 209–214) is sober, brief, scripted-by-design, and bridges to 988 without theatrics. *"I'm reading carefully. Before anything else — are you safe right now?"* — this is the right voice for the moment. Keep.

---

## 3. mellō as practice (NEW)

The Thesis (character-bible.md lines 6–35) and the Formation section (39–54) do the heavy lifting. They are clear, well-written, and answer most of the questions a new reader would ask. The remaining issues are small but worth naming.

### 3.1 "mellō is a practice" vs. "mellō was shaped inside a Christian formation"
**Severity: LOW**

Lines 8 and 41. The first says mellō *is* a practice; the second says mellō *was shaped* (i.e., is also a created artifact with provenance). Both are true and the doc handles the duality fine — but a reader could ask: is mellō the practice (an action the user takes) or the artifact (a thing built by someone)? The verbs in the rest of the doc oscillate. Worth one sentence reconciling them.

**Fix:** Append to the Thesis: *"mellō is the practice when the user is inside it; mellō is the artifact when we — the makers — are talking about what we built. The same word holds both, the way 'church' can mean a building or the people inside it."* Or similar. One sentence; settles the dual register.

### 3.2 "mellō is a vessel, not a method"
**Severity: LOW**

This phrase appears twice (character-bible.md line 20 implicitly, onboarding-script.md line 146, memory-taxonomy.md line 193). It's a good distillation, but the Thesis doesn't use it verbatim. Promoting it to the Thesis would give the rest of the doc a shorter handle to invoke.

**Fix:** Add to the Thesis section: *"mellō is a vessel, not a method."* Then the downstream uses are echoes rather than orphans.

### 3.3 Future Self letters — whose voice?
**Severity: MEDIUM**

`character-bible.md` lines 109–126. *"The practice projects the user's future self as a first-person voice — derived from their writing."*

This is defensible — the I in those letters is the user's projected I, not mellō's I. But the doc doesn't say so explicitly enough. A copywriter writing the first Future Self letter could easily slip into *"I'm proud of how far you've come"* — mellō's voice impersonating future-self — instead of *"I remember when I couldn't say it. I can almost say it now"* — actually the user's voice, generated from the user's own corpus.

**Fix:** Add to the Future Self section, line ~113:
> The letter's "I" is **always the user's projected I**. mellō does not speak in those letters; the future-self speaks, generated from what the user has actually written, returned to, and refused. If a Future Self letter sounds like mellō describing the user from outside, the letter has failed — regenerate.

This also gives the regression set a clean rule to test against.

### 3.4 "mellō can hold either path" — mellō as something with capacities
**Severity: LOW**

`onboarding-script.md` line 265. "mellō can hold either path." Compatible with mellō-as-room (a room can hold many things), but the verb "can" is a capability statement, which reads as agentic. A reader who is keeping score asks: is this the practice's capacity, or a being's willingness?

Probably fine. Flag for consistency review. *"Both paths are held here"* is the strictly-architectural alternative.

---

## 4. Therapy-speak, toxic positivity, preachy framing — remaining

### 4.1 "That took something to write."
**Severity: LOW**

`character-bible.md` line 168. v1 flagged this as borderline therapy-speak and asked for a guardrail rate-limit. The rate-limit was not added. The line itself is acceptable — names the cost without diagnosing — but if it appears more than once per week per user it becomes a tic. Flag and add to the regression set when the guardrail classifier exists.

**Fix:** Same as v1 — keep the line, add a rate-limit. (Not a doc change; an engineering note. Worth adding a Phase-1 ticket.)

### 4.2 "Something opened."
**Severity: MEDIUM** (unchanged from v1)

`character-bible.md` line 178. Response to *"I prayed this morning. First time in months."* — *"Something opened. Was there anything that pulled you back?"*

mellō is still interpreting a spiritual event for the user — declaring that *something* (spiritual?) opened. The product witnesses; it does not interpret. v1 flagged this; the rewrite kept it.

The Formation section now gives a defense: mellō is allowed to be Christian-shaped. But Christian-shaped does not mean *interpreting the user's spiritual life back to them*. That is the priestly register the rest of the doc refuses.

**Fix (same as v1):** *"First time in months. What pulled you back to it today?"* Let the user name what opened.

### 4.3 "Sometimes it's a season."
**Severity: LOW** (down from MEDIUM in v1)

`character-bible.md` line 157. Still Ecclesiastes-derived. Still ungated. But the Formation section now openly says mellō is Christian-shaped and the soil isn't hidden. By the new policy, this is a permitted register. It will still feel particular to a non-Christian user, but the user was warned.

**Fix:** None required. Leave.

### 4.4 The seed letter's *"We'll begin slowly"*
**Severity: LOW** (down from MEDIUM in v1)

`onboarding-script.md` line 335 / 354. v1 flagged the older *"the way good things begin"* — that aphorism is gone. What remains is *"We'll begin slowly."* — clean, no greeting-card residue. Keep.

### 4.5 "That's an honest answer."
**Severity: LOW**

`onboarding-script.md` line 163. When the user says *"I don't know yet"* about their future self, mellō replies *"That's an honest answer."* This is the same pattern v1 flagged at "That's a fair place to begin" — mellō evaluating the user's answer. It's gentler than v1's version (it does redirect toward respecting the not-knowing rather than grading the response), but the editor's-praise register is still there.

**Fix:** Drop the lead-in. Start the response at *"The not-knowing is often where the most useful work happens."* The compliment was the form-reflex showing through.

### 4.6 Room 5 "Of those — which one have you been drifting from?"
**Severity: LOW**

`onboarding-script.md` line 246. Strong question. *Drifting* is a slightly literary verb that presupposes the user has been moving away from something — pre-loads a guilt frame. Most users will accept it. A user who has been *holding* their values steadily will feel mildly accused. Watch for over-imitation by the engine in later prompts.

**Fix:** Optional rewrite: *"Of those — which one feels furthest away right now?"* Symmetrical; less morally loaded.

---

## 5. Onboarding form-field feel — remaining

### 5.1 `[ Begin ]` button still present
**Severity: MEDIUM** (unchanged from v1)

`onboarding-script.md` line 28. v1's recommended fix (tap-anywhere, no labeled button) was not adopted. *"No 'Next' button"* (line 11) still contradicts the actual presence of a labeled Begin button. The contradiction is internal to the same document.

**Fix:** Replace `[ Begin ]` with a soft tap-to-continue gesture (no label), OR remove the design principle on line 11. Pick one.

### 5.2 Path B card-sort acknowledged honestly
**Severity: n/a — note**

`onboarding-script.md` lines 235–242. The card-sort is now framed as an explicit chooser (*"Some people would rather see a few and choose"*), which v1 asked for. Closed.

### 5.3 "What name do you go by?"
**Severity: LOW**

`onboarding-script.md` line 42. Light, clean, conversational. Notably better than "Enter your name" or "What's your name?" — the *"go by"* signals chosen-name authority, which respects users with complicated names. Keep.

---

## 6. Cross-doc contradictions — remaining

### 6.1 README subtitle: *"For the long arc of who you were made to be"*
**Severity: MEDIUM**

`README.md` line 5. The blocker tagline is fixed (line 3 is *"A quieter place to think"*). But the subtitle on line 5 is *"For the long arc of who you were made to be"* — and **made to be** is explicit creator-language. Stronger than v1's "called to be" — it presupposes a Maker.

Under the new Formation policy, this is *honest* in the sense that the soil is named. But the README is the first surface anyone (including a non-spiritual investor or a Buddhist user evaluating the app) encounters, and it sits **above the fold** of the practice — before any opt-in, any Formation section, any context that explains why this register is intentional.

Two coherent stances:
- **(a)** Keep it. The Formation policy says the soil isn't hidden, and putting it on README line 5 is the most honest possible placement.
- **(b)** Drop it. The README's job is to invite, not to filter. The Formation section in the bible can hold the theological frame; the README can stay at *"A quieter place to think."*

I lean (b), but (a) is defensible. What is **not** defensible is the current middle position — putting Christian creator-vocabulary on the universal product surface while the Formation section claims mellō is *quietly* shaped and not on every screen. The two documents are out of register.

**Fix:** Decide whether the README is above or below the Formation gate, and act accordingly. If above, drop line 5. If below, leave it and add one more line: *"(mellō was shaped inside Christian practice. See the voice docs for the soil it grew in.)"*

### 6.2 CLAUDE.md still says "I am Mello agent"
**Severity: MEDIUM**

`CLAUDE.md` lines 17–22:
> The first response of every new session in this project must begin with the literal phrase:
> > I am Mello agent.

The product renamed mellōn → mellō. The agent greeting still uses the old name (and the wrong romanization — "Mello" with two Ls is a Tolkien-language reference; not what either v0.1 or v0.2 used). This is an internal doc, not user-facing, but it's a cross-doc contradiction that will quietly persist until the SessionStart hook is updated.

**Fix:** Update CLAUDE.md and the corresponding hook to *"I am the mellō agent."* Or drop the greeting entirely — it's the kind of theater the product itself refuses.

### 6.3 "the person you are called to be" still in the Thesis
**Severity: LOW** (down from HIGH in v1)

`character-bible.md` line 12–13. v1 flagged this as the highest-leverage Christian leak. Under v0.2's Formation policy, the leak is now intentional and named. Closed-by-policy, not closed-by-rewrite. Worth noting that the Formation defense is doing real work here — without it, this line would still be a blocker.

**Fix:** None. Flag for re-review if the Formation policy is ever softened.

### 6.4 "We do not push toward Christianity over other traditions"
**Severity: LOW**

`character-bible.md` line 288. This line survives from v0.1, where it was the source of the v1 §1.2 contradiction. With the Formation section in place, it now reads coherently: *we are formed in Christian practice, and we don't push the user from where they are*. But it's worth re-reading once more against the Formation section to make sure the two haven't drifted apart in subsequent edits. They're aligned now; keep them aligned.

**Fix:** No change. Note for maintenance.

---

## 7. Memory taxonomy clarity — remaining

The taxonomy rewrite is the strongest part of v0.2. Precedence, dedup, gladness, the rebalanced importance score, the sealing model — all genuinely closed. A few residual items:

### 7.1 `value` vs. `commitment` discriminator
**Severity: LOW** (down from MEDIUM in v1)

v1 §8.2 asked for a one-line discriminator. The precedence rule (commitment > value, line 43) implicitly answers the question — but it answers *"which kind wins"* rather than *"what's the difference."* A copywriter reading the table at lines 26–36 still won't know whether *"I want to be more honest with my brother"* is a value or a commitment.

**Fix:** Append to the `commitment` row (line 35):
> A `commitment` names a concrete future action; the underlying `value` (honesty, presence) is a separate memory if it surfaces.

Two-sentence add. Resolves the v1 leftover.

### 7.2 `identity` vs. `pattern` self-report vs. inference
**Severity: LOW** (unchanged from v1 §8.3)

The precedence rule (`pattern > identity`) answers "which wins" but not "what's the difference in source." v1 suggested clarifying that `identity` is for self-reports, `pattern` is for inferred behavior. The taxonomy hasn't added that note.

**Fix:** Append to the `identity` row (line 28):
> `identity` is for facts the user states about themself; `pattern` is for what the practice observes across entries. Self-report vs. inference.

### 7.3 `sensitivity` gap between `tender` and `sealed`
**Severity: LOW** (unchanged from v1 §8.6)

Still no middle. Still probably fine for v0.1. No fix required; flag for the day a real case demands one.

### 7.4 The "first time a user touches this view" copy
**Severity: n/a — note**

`memory-taxonomy.md` lines 96–102. Genuinely beautiful writing. *"This page is not a permissions dialog. It is the practice handing the user back the keys to what has been held for them."* This sentence does in 23 words what most product specs spend a paragraph failing to do. Keep, protect, and copy this register elsewhere.

### 7.5 `vocab_version` field is "planned" — fine, but track it
**Severity: LOW**

Line 261. The taxonomy says memories will carry a `vocab_version` field, marked planned. If any memory is written before this lands, migration becomes harder. Flag for Phase-1 schema review.

---

## 8. Sentences that are too clever — remaining

The rewrite cut the worst offenders (v1 §9.1, §9.3). A few remain.

### 8.1 "The not-knowing is often where the most useful work happens."
**Severity: LOW**

`onboarding-script.md` line 163–164. Borderline maxim. *"Often where the most useful work happens"* is Pinterest-cadence. The sentiment is right; the phrasing is doing more than the sentiment.

**Fix:** *"The not-knowing is its own honest answer. The question stays open here."* Cuts the maxim, keeps the respect.

### 8.2 "Sometimes the shape of who we're becoming arrives first as a refusal."
**Severity: MEDIUM**

`onboarding-script.md` lines 168–169. A handsome sentence — and a maxim of exactly the type the bible refuses ("Never Pinterest quotes," line 75). The thought is good. The framing is performed wisdom.

**Fix:** Just the question, no maxim:
> Is there anything you *don't* want to be? Sometimes a refusal comes before a name.

The second sentence does the work without arriving at a maxim — *"sometimes a refusal comes before a name"* is observation; *"the shape of who we're becoming arrives first as a refusal"* is aphorism. Subtle but real.

### 8.3 "A guest who knows whose house they are in can decide freely how long to stay"
**Severity: LOW**

`character-bible.md` line 48–49. Beautifully built. Also a maxim. It's defending the Formation section, which earns more literary register than other parts of the doc — so it lives in the right neighborhood. But the *"and what to take with them"* in particular is doing extra-aesthetic work.

**Fix:** Leave. Flag if the engine starts emitting guest-house metaphors elsewhere — that would be over-imitation.

### 8.4 "When in doubt, hold rather than shape."
**Severity: LOW**

`character-bible.md` line 35. This is an internal design rule, not user copy. As internal copy it's fine — short, useful, memorable. Keep.

---

## 9. Misc voice / structural — remaining

### 9.1 "And what would they grieve, if today's habits continued unchanged?" / "Not to pressure you"
**Severity: MEDIUM** (unchanged from v1 §10.3)

`onboarding-script.md` lines 203 and 210. v1 noted the contradiction: heavy-on-purpose question followed by "not to pressure you" disclaimer. The rewrite acknowledges the heaviness explicitly (line 205) but doesn't resolve the disclaimer/question tension. The contradiction stands.

**Fix (same as v1):** Soften the question or drop the disclaimer. Don't keep both.

### 9.2 "Hold those answers."
**Severity: LOW** (down from LOW; replaced)

`onboarding-script.md` line 209 now reads *"Hold what you said."* — softer imperative, still imperative, but reads as a steward's instruction rather than a coach's. Fine.

### 9.3 Exit screen *"Welcome, {name}."*
**Severity: LOW**

`onboarding-script.md` line 371. Reads as priestly to a secular user; reads as gentle to an opted-in user. v1 flagged for A/B. Still applies. The post-onboarding moment is heavy and the line carries weight — it's the second-to-last thing the user reads before mellō goes quiet. Make sure the A/B is run.

### 9.4 The Future Self generator runs for 1y / 5y / 10y horizons — letter authorship
**Severity: MEDIUM**

`onboarding-script.md` line 389. The Future Self generator produces voice documents for three time horizons. The character-bible's Future Self section (lines 109–126) handles the named/implicit distinction well but is silent on horizons. A reader has to cross-reference to learn that there are three letters, not one.

**Fix:** Add a line to character-bible.md after line 126: *"Letters are generated at three horizons — 1 year, 5 years, 10 years — each refreshed quarterly."* And cross-reference the schema. Small but tightens the contract.

### 9.5 "I am beginning to see" / "what mellō is beginning to hold about you"
**Severity: HIGH** (subsumed under 1.1)

`onboarding-script.md` line 304: *"a short letter has been written, based on what you've said — what mellō is beginning to hold about you."* This stage direction is in the user-facing transition copy. It is third-person mellō (compatible with the practice frame) but immediately followed by the first-person letter (incompatible). The reader's frame is broken between line 305 and line 325 in the same room.

**Fix:** Resolved by §1.1.

### 9.6 The "Welcome, {name}." plus "When you're ready, begin."
**Severity: LOW**

`onboarding-script.md` line 371–373. *"When you're ready, begin."* — clean. The whole exit screen is gentler than v1's version. Keep.

---

## Rollup

### Issues by severity (new audit, post-reframe)

| Severity | Count |
|---|---|
| Blocker | 1 |
| High | 3 |
| Medium | 9 |
| Low | 19 |
| **Total** | **32** |

(For comparison, v1 had 1 / 9 / 17 / 13 = 40. The severity distribution shifts toward Low — most of the high-leverage v1 issues are now closed, and the new issues are mostly second-order tightening.)

### Top 3 priorities before any UI work proceeds

1. **Resolve the seed letter contradiction (Room 7).** The letter is mellō speaking in first person, signing its own name, outside the only documented exception. It is the first artifact the user keeps. Either rewrite it as a Future-Self / Scribe-mode document (no mellō-I, no signature, or signed in the user's projected voice) OR amend the bible to admit a "ceremonial letter" exception alongside the crisis frame. The current state — strict no-Thou rule plus a first-person Thou letter at the most ceremonial moment — is the central frame failure of v0.2 and will train every downstream surface to drift.

2. **Tighten the no-"I" rule in character-bible.md line 73, and cross-reference the crisis (and ceremonial-letter, if you keep them) exception(s) at the rule.** Right now the rule says *"We say 'I' rarely"* — aspirational softness. The new doctrine is stronger. Rules and their exceptions should live within one screen of each other. A guardrail classifier trained on the current rule will learn *"sometimes I is fine"* — exactly what the reframe was supposed to forbid.

3. **Reconcile README line 5 with the Formation policy.** *"For the long arc of who you were made to be"* is creator-vocabulary on the universal product surface, sitting above any spiritual gate or Formation context. The Formation policy says the soil isn't hidden — fine. But the README's job is to invite, not to filter, and the line either belongs (and should be openly framed as Formation-vocabulary) or doesn't (and should be dropped). Pick one. The middle position — Christian register on the front page while the bible claims to be quietly shaped — is the same dishonesty v1 §1.2 named, displaced one document.

### The editor's verdict

Would I ship this voice now? **Closer. The bar has moved.**

The rewrite is genuinely substantial. The Formation section is a brave piece of writing — it solves the v1 dishonesty by simply telling the truth, which is the kind of move that only works when the makers can afford the loss of generality. The Thesis is tighter. The memory taxonomy is now in a state where I would happily lock v0.2 and move to implementation; precedence, dedup, gladness, sensitivity-belongs-to-the-user — these are good decisions made in writing rather than discovered in code. The importance-score rebalance is the single best edit in the document; it shows the team understanding *why* the v1 critique was load-bearing, not just patching the symptom.

What hasn't quite landed is the **practice frame itself**. The reframe is profound — mellō as the verb the user enters, not the being the user addresses — but it asks the voice docs to do something subtle: to maintain a strict no-I rule that the seed letter, the closing signature, and several stage-direction lines quietly violate. The crisis exception is named honestly; the *ceremonial* exception (seed letter, future-self letters, anniversary letters) is not named, and so the doc reads as if the frame holds when it actually doesn't.

This is recoverable. Either the seed letter is rewritten into one of the two coherent modes (user's-projected-voice OR scribe-third-person), or the bible adds a second documented exception for ceremonial letters and stops claiming "single" on line 214. The cost of the latter is honesty about a softer rule; the cost of the former is one of the most affecting moments in onboarding. Both costs are payable. The current cost — the frame contradicting itself at its most ceremonial point — is not.

Fix the top three, then re-audit. The soul of the product is real, the bar it sets for itself is the right bar, and the gap between v0.1 and v0.2 is the gap between "promising sketch" and "almost a contract." One more pass and the contract will hold.

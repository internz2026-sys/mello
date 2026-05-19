# mellō — Memory Taxonomy

> The controlled vocabularies. What mellō is allowed to "see" in a journal entry.
> Locking these early matters — they propagate into retrieval, prompts, and the entire memory engine.
>
> Version: 0.2 — 2026-05-16 (mellō reframe — practice, not Thou)

## Why controlled vocabularies

Free-text tags drift, fragment, and cluster poorly. A small, deliberate vocabulary:

- Makes retrieval filters reliable ("memories about fear in the last 6 months")
- Forces the AI to choose a real label rather than improvise
- Makes the user-facing "What mellō remembers" view legible
- Keeps the index from exploding with synonyms

Vocabularies grow slowly and intentionally. Anyone adding a term must
explain why an existing term doesn't fit.

---

## Memory `kind`

What kind of thing is this memory?

| value | meaning |
|---|---|
| `identity` | Stable facts about who the user is (name, age, where they live, who their people are) |
| `pattern` | A recurring behavior, response, or rhythm observed across entries |
| `value` | A stated or revealed value the user lives by (or wishes they did) |
| `relationship` | A specific person and the texture of that relationship |
| `fear` | A recurring fear or worry, named or observed |
| `hope` | An aspiration, dream, or longing |
| `wound` | A grief, loss, trauma, or unresolved hurt |
| `commitment` | A specific intention the user has named ("I want to call mom weekly") |
| `gladness` | A recurring source of joy, life, or affection in the user's days |

### Precedence — one `kind` per memory

A memory has exactly **one** `kind`. When several could apply, the Distiller uses this precedence (deepest applies):

```
wound  >  pattern  >  fear  >  commitment  >  value  >  relationship  >  hope  >  gladness  >  identity
```

A recurring fear that traces to childhood is `wound`, not `fear` or `pattern`.
A chronic late-night-overthinking is `pattern`, not `identity`.
A longing to be more present is `hope`, not `value` — values are what one already lives by; hopes are what one is reaching for.

The Distiller logs the considered kinds in an internal `kind_candidates[]` field so precedence calls can be audited later.

Note: a memory in the spiritual dimension is identified by non-empty `spiritual_themes[]`, not by a separate `kind`. The `kind` describes the *shape* of the memory (wound, pattern, hope); spirituality is a *layer* on top.

## Memory `stability`

How fast does this kind of memory change?

| value | meaning | decay |
|---|---|---|
| `stable` | Facts and core identity. Almost never changes. | none |
| `evolving` | Beliefs and values in motion. Reinforce or contradict over time. | slow |
| `volatile` | Current emotional weather. This week's stress. | fast (~30 days) |

## Memory `sensitivity`

How carefully should this memory be surfaced?

| value | meaning | retrieval rules |
|---|---|---|
| `normal` | Default. Usable in chat, letters, daily prompts. | unrestricted |
| `tender` | Vulnerable content — grief, fear, shame. | excluded from proactive notifications; OK in deep reflection if directly relevant |
| `sealed` | Trauma, confession, deeply private. Held but not touched. | only surfaced if user explicitly invokes; never proactive |

The Distiller's classification is a **default**, not a verdict. The user is the final author of how tenderly their own memories are held.

### Sensitivity belongs to the user

Every memory in mellō surfaces its `sensitivity` to the user. From the "What mellō remembers about me" view, the user can:

- Read what mellō understood the memory to hold.
- See how carefully mellō has been keeping it.
- Promote a memory's sensitivity: `normal → tender → sealed`. Always allowed, no questions asked.
- Never demote. Once the user has chosen to seal a memory, it is sealed. Even mellō cannot walk that back. Re-opening a sealed memory is an act only the user can take, in their own plain words.

#### What sealing actually means

A `sealed` memory:

- Is excluded from every retrieval — chat, letters, daily prompts, weekly reviews, pattern observations, Future Self generation, notifications. Everywhere.
- Is preserved. Never deleted by the system. It remains the user's, whole, until the user chooses otherwise.
- Can be read back, in full, only when the user asks for it directly — in their own act of remembering.
- Is not forgotten. It is held in trust.

#### The first time a user touches this view

When a user opens a memory's sensitivity for the first time, the page speaks in plain words — never settings-screen language:

> *This is what was noticed here, and how carefully it has been held.*
> *If you'd rather it were held more carefully — or set down entirely —*
> *say so. You are the keeper of what is yours.*

This page is not a permissions dialog. It is the practice handing the user back the keys to what has been held for them.

---

## Emotion vocabulary (~30 values)

Used in both `memories.emotions[]` and `journal_entries.mood_words[]`. Bucketed for prompting and re-ranking:

### Heavy
`grief` `loneliness` `shame` `fear` `dread` `despair` `regret` `anger` `bitterness` `numbness`

### Tender
`tiredness` `sadness` `disappointment` `worry` `longing` `tenderness` `vulnerability` `nostalgia`

### Mid
`restlessness` `confusion` `frustration` `boredom` `ambivalence`

### Warm
`gratitude` `joy` `peace` `wonder` `affection` `contentment` `relief` `awe`

### Engaged
`curiosity` `determination` `delight`

**Rule:** Max 3 emotions per memory. The Distiller must choose the most load-bearing.

---

## Theme vocabulary (~50 values)

Broad life domains and recurring topics. Used in `memories.themes[]`.

### Work & Vocation
`work` `career-direction` `burnout` `ambition` `failure` `success` `craft` `meaning-of-work` `calling`

### Money
`money` `financial-fear` `stewardship` `generosity` `simplicity` `consumption`

### Body & Health
`sleep` `exercise` `body` `food` `illness` `aging` `rest`

### Mind
`anxiety` `depression` `attention` `overthinking` `mental-load`

### Relationships
`marriage` `parenting` `friendship` `family` `loneliness-of-presence` `conflict` `forgiveness` `boundaries` `intimacy`

### Self
`identity` `self-image` `confidence` `comparison` `perfectionism` `self-compassion` `doubt` `faith`

### Time
`time` `rhythm` `urgency` `slowness` `seasons` `silence`

### Change
`change` `habit` `formation` `relapse` `return` `practice` `resistance`

### Story
`past` `future` `regret` `legacy` `mortality`

**Rule:** Max 4 themes per memory. Spiritual content has its own vocabulary (`spiritual_themes[]` — see below); it does not appear in the general theme list.

---

## Spiritual themes (~20 values, opt-in only)

Only populated when `profiles.spiritual_opt_in = true`.

`trust` `surrender` `humility` `lament` `repentance` `grace` `discipleship` `vocation` `stewardship` `obedience` `presence` `service` `community` `discernment` `worship` `prayer` `scripture` `church` `sabbath`

A Christian-formation vocabulary, intentionally. mellō was shaped inside Christian practice, and the spiritual layer reflects that texture honestly. Users from other traditions can describe a spiritual life here too — the words will feel particular. That is part of being formed by something, rather than nothing.

**Dedup rule:** Each word in mellō's vocabularies appears in exactly one place. `gratitude` is an emotion, not a spiritual theme. `forgiveness` is a relationships theme, not a spiritual theme. `hope` is a `kind`, not an emotion or spiritual theme. `silence` and `rest` are themes anyone can use. `humility`, `stewardship`, `presence`, `lament`, `discernment` live only in `spiritual_themes[]`. This keeps retrieval honest — the same concept can't fire in three fields and inflate its own score.

---

## Importance scoring

A memory's `importance` (0.0–1.0) is computed at distillation time and updated on reinforcement:

```
importance = clip(
    0.30 * emotional_intensity         # how charged the underlying entries are
  + 0.25 * recurrence_signal           # observed multiple times → matters
  + 0.20 * self_reference_density      # first-person presence in the writing
  + 0.10 * relational_density          # references to people, body, lived world
                                       #   — present even without abstract values named
  + 0.05 * named_values_or_calling     # explicit naming of values, identity, vocation
  + 0.05 * future_orientation          # talks about who they're becoming
  + 0.05 * present_attention           # observes what is, not what should be
, 0.0, 1.0)
```

**Note on the rebalance.** An earlier draft weighted explicit value-or-identity mention at 0.15. That would have quietly downranked the user in a wordless grieving season — exactly the user whose memories matter most. The current formula keeps named values as a signal (0.05) but adds `relational_density` (0.10) so a user who writes about their people, their body, their lived world scores fairly even when they cannot or will not name abstract values. mellō is a vessel, not a method.

`identityWeight` (0.0–1.0): how core to the user's self-concept this memory is.
Computed separately, used to protect memories from decay.

`decayedRelevance`: applied at retrieval time.
- `stable` memories don't decay.
- `evolving` memories decay slowly (half-life ~6 months).
- `volatile` memories halve in relevance every ~30 days unless reinforced.

---

## Retrieval ranking

**Invariant: retrieval relevance outranks historical importance.**

A memory whose query-similarity is below `SIMILARITY_FLOOR` (default 0.30,
env-tunable) is rejected *before* any scoring. Importance and recency cannot
lift an emotionally irrelevant memory into the result set. Empirically
grounded (STEP 3, 2026-05-16): genuine matches scored similarity >0.42;
haunting/irrelevant scored <0.19. Without the gate, a 0.85-importance wound
surfaced on the query "I had a good morning today" — the gate makes that
return silence instead.

This is the engineering form of the voice principles "trust silence" and
"hold rather than shape." An emotionally unrelated query should return
nothing. Silence is a correct retrieval answer, not a failure.

Pipeline:

```
1. embed query
2. fetch candidates from Qdrant (user-scoped, sealed excluded by default)
3. RELEVANCE GATE: drop every candidate with cosine_similarity < SIMILARITY_FLOOR
4. score the survivors:
     score = 0.5 * cosine_similarity
           + 0.3 * importance
           + 0.2 * recency_signal
5. diversity pass:
     - drop near-duplicates (similarity > 0.9 to a higher-scored sibling)
     - cap any single theme to 2 results
     - final cut: top 6–8 memories
```

Deferred (see docs/follow-ups.md R-floor): per-kind floors — wounds/grief/
sealed should require a *higher* floor than habits/values. One universal
gate first; differentiate only after a larger corpus validates the need.

---

## What the Distiller must NOT produce

- Memories with summaries longer than 3 sentences.
- Memories without `evidence[]` pointing back to source journal entries.
- Memories that name third parties beyond what the user named.
- Memories that interpret motives the user didn't state.
- Memories that diagnose ("user has anxiety") — describe the behavior, not a label.
- Memories about specific isolated events ("user had coffee with X on Tuesday").
  These belong in episodic, not semantic.

---

## Distiller output schema

```json
{
  "kind": "fear",
  "stability": "evolving",
  "sensitivity": "tender",
  "summary": "Recurring fear of disappointing her father, surfacing especially around career decisions.",
  "evidence": ["entry_a8f3", "entry_91cc", "entry_b201"],
  "emotions": ["fear", "longing"],
  "themes": ["family", "career-direction"],
  "relationships": ["dad"],
  "spiritual_themes": [],
  "importance": 0.78,
  "identity_weight": 0.6,
  "first_observed_at": "2026-04-08T20:14:00Z",
  "last_reinforced_at": "2026-05-15T22:01:00Z"
}
```

---

## Versioning

This document is `v0.1`. Any vocabulary change is a versioned event — old
memories keep their original tags but new memories use the current vocabulary.
The Distiller logs which vocab version produced each memory (planned field:
`vocab_version`).

Changes require:

1. A note explaining why an existing term doesn't fit.
2. Migration of existing memories (or explicit decision to leave them on the old vocab).
3. Update to the Distiller's system prompt.
4. Update to retrieval re-rankers that depend on the vocabulary.

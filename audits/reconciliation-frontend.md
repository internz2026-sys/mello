# Frontend Reconciliation Audit — mellō

> Reconciles the live frontend code (web + mobile + e2e) against the canonical voice docs as of 2026-05-16.
> Canonical sources: `voice/character-bible.md` (v0.2 — practice, not Thou) and `voice/onboarding-script.md` (v0.2).
> The auditor only reviews — no code is changed by this pass.

---

## A. Brand rename completeness

**Spec:** Zero remaining `mellōn` (macron + n) anywhere in apps/web, apps/mobile, e2e. The brand is `mellō`.

**Search performed:** ripgrep on `mellōn` (literal, UTF-8) and case-insensitive `mell[oō]n` across both apps and `e2e/`.

**Findings:**

- No user-visible `mellōn` occurrences remain. Render strings are clean.
- ASCII `mello` survives only in technical identifiers, never on screen:
  - `apps/web/package.json:2` — `"name": "mello-web"`
  - `apps/mobile/package.json:2` — `"name": "mello-mobile"`
  - `apps/mobile/app.json:4` — `"slug": "mello-mobile"`
  - `apps/mobile/app.json:7` — `"scheme": "mello"` (deep-link scheme)
  - `apps/mobile/app.json:16,22` — `bundleIdentifier`/`package` `co.melloapp.mobile`
  - `e2e/package.json:2` — `"name": "@mello/e2e"`

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| low | apps/mobile/app.json:7 `"scheme": "mello"` | Brand is `mellō`. Deep-link scheme is not user-visible but appears in shared URLs (`mello://...`). | `mello` | Optional: keep for now (ASCII deep-link schemes are conventional); revisit before launch alongside the bundle ID question. Not blocking. |
| low | apps/mobile/app.json:16,22 bundle IDs `co.melloapp.mobile` | Brand is `mellō`. App store listings derive from these. | `co.melloapp.mobile` | Decide before first store submission. Changing later is painful (especially iOS). Not blocking pre-launch dev. |
| low | All `package.json#name` fields | Internal package name, never rendered. | `mello-web`, `mello-mobile`, `@mello/e2e` | Cosmetic. Update to `mello-*` when convenient. Not blocking. |

**Result for check A:** No user-facing rename leaks. All `mello` survivors are technical identifiers.

---

## B. Welcome screen copy match

**Spec (`onboarding-script.md`, Pre-room):**
- Brand: `mellō`
- Subtitle: `future self — a place to think slowly`
- Note: `Take as long as you'd like. Pause anytime.`
- A `[ Begin ]` affordance.

### Web — `apps/web/app/page.tsx`
- Line 11 renders `mellō` (direct UTF-8). Match.
- Line 14 renders `future self — a place to think slowly`. Match.
- Line 19 renders `Take as long as you'd like. Pause anytime.`. Match.
- Lines 24–26 render a `Begin` Link inside `<Button>` pointing to `/onboarding/room-1`. Match.

`apps/web/app/layout.tsx` metadata (lines 17–18) carries the same brand + description; both clean.

### Mobile — `apps/mobile/app/index.tsx`
- Line 23 renders `mell&#x14D;` (HTML entity for `ō`). Renders identically to `mellō` in React Native `<Text>`. Match.
- Line 30 renders `future self — a place to think slowly`. Match.
- Line 37 renders `Take as long as you'd like. Pause anytime.` (via `&apos;`). Match.
- Lines 43–50 render a `Pressable` labelled `Begin` that navigates to `/(rituals)/morning`. Match.

**Findings:** No mismatches.

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| (none) | — | — | — | — |

**Result for check B:** Welcome screen copy is canonical on both platforms.

---

## C. Room 1 dialogue match

**Spec (`onboarding-script.md` §Room 1):**
- Step 1: `Welcome.` + `Before anything else — what name do you go by?`
- Step 2: `{name}.` + `This is a place to be known slowly. Nothing said here is shared with anyone — you can always change, hide, or delete what you say.` + `So — what brought you here today?`
- Step 3 (if specific): `What you named is held here.` + `Nothing needs to be solved tonight.`

### Web — `apps/web/app/onboarding/room-1/page.tsx`

| Step | Spec line | Code line | Match |
|---|---|---|---|
| 1 voice | `Welcome.` | line 30 `<Voice>Welcome.</Voice>` | exact |
| 1 whisper | `Before anything else — what name do you go by?` | lines 33–35 | exact |
| 2 voice | `{name}.` | line 70 `<Voice>{name}.</Voice>` | exact |
| 2 voice | `This is a place to be known slowly. Nothing said here is shared with anyone — you can always change, hide, or delete what you say.` | lines 72–75 | exact |
| 2 whisper | `So — what brought you here today?` | line 78 | exact |
| 3 voice 1 | `What you named is held here.` | line 110 | exact |
| 3 voice 2 | `Nothing needs to be solved tonight.` | line 112 | exact |

None of the old-frame remnants (`Hello. I'm mellō.`, `I'd like to know you slowly`, `Thank you for trusting me with that. I'll hold it carefully`, `Most apps want your data; I want your story.`) appear in the code.

Branching logic for short/guarded/improve/hustle answers from the script (§Follow-up logic) is **not implemented** in the page yet — step 3 unconditionally lands on the held/unsolved pair. That's a missing feature, not a voice drift.

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| med | room-1/page.tsx:114-122 (step 3 → no onward navigation) | After step 3, room transition is `A few more questions, slowly. You can stop anytime.` leading to Room 2. | `continue` button has `onClick={() => {}}` — dead-ends the flow. | Wire the button to a Room 2 route (or to a placeholder until Room 2 exists). Add the transition line. Track Room 2 as missing scaffolding. |
| med | room-1/page.tsx — follow-up branching missing | Four conditional follow-ups (short/specific/improve/hustle) per onboarding-script §Follow-up logic. | Step 3 is hardcoded to the "specific person/event" branch only. | Either gate the step 3 copy on a content classifier, or accept this as a Phase-0 simplification and explicitly note in code. Not a voice violation but a script gap. |

### Mobile — Room 1 absence

- Mobile has **no** Room 1 page. `apps/mobile/app/index.tsx` (Begin button, line 45) routes directly to `/(rituals)/morning`.
- `apps/mobile/app/(rituals)/morning.tsx` is a morning ritual (mood pulse + intention), not onboarding.
- The mobile Begin button therefore short-circuits the entire 7-room onboarding.

Morning ritual user-facing strings:
- line 64: `How are you arriving to today?` — voice-compliant (observational, no first-person AI).
- line 97: `one intention, if anything comes (optional)` — voice-compliant.
- line 122: `save` — neutral.
- ExitScreen line 138: `Good.` — matches the paired-examples cadence (cf. character-bible.md line 242: "Good. What did you notice?").
- line 141: `carry it lightly today` — voice-compliant, low and quiet.

No voice violations in morning.tsx. The issue is structural, not tonal.

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| high | apps/mobile/app/index.tsx:45 — Begin routes to `/(rituals)/morning` | Begin should enter onboarding (Room 1). The exit screen (`When you're ready, begin.`) is what eventually lands the user on the home/ritual surface — after Room 7 has set seed memories. | First-tap Begin opens the morning ritual, skipping every room. | Either (a) build a mobile `app/(onboarding)/room-1.tsx` mirroring the web flow and re-target Begin there, or (b) explicitly document the mobile app as "Phase 0 ritual-only, onboarding lives on web" until parity is built. The current state silently bypasses identity capture. |

**Result for check C:** Web Room 1 copy is fully canonical. Mobile has no Room 1, and its Begin bypasses onboarding entirely — voice-clean but structurally wrong.

---

## D. Forbidden voice patterns

**Spec:** No exclamation points outside intentional quotes; no hustle vocabulary (`amazing`, `crush`, `you got this`, `let's go`, `boost`, `supercharge`, `unlock`, `level up`); no `great question` / `wonderful`; no emoji; no `as an AI`; no therapy-speak (`I'm hearing you`, `I'll hold this carefully`); no first-person AI voice in non-crisis contexts (`I notice`, `I'd like to`, `I'm here`). Crisis frame is the only exception, and it should not surface on non-crisis screens.

### Method
ripgrep, case-insensitive, on every user-facing string source:
- `amazing|wonderful|great question|crush|you got this|let's go|boost|supercharge|unlock|level up` → **no matches** in `apps/`.
- `I'm hearing|I notice|I'd like to|I'm here|hold this carefully|as an AI|hello\. i'm` → **no matches** in `apps/`.
- `Thank you for trusting me|I'll hold|I want your story` → **no matches** in `apps/`.
- `988|crisis|self-harm|suicide|safe right now` → **no matches** in `apps/`. Crisis copy is not leaking into non-crisis surfaces.
- `!` in user-facing strings: the only hit in `apps/mobile/app/_layout.tsx:22` is the logical-not in `if (!loaded && !error)` — code, not visible text. README contains `!` references inside a documentation list rebuking exclamation points — that's the rule statement, not rendered UI.
- Emoji literal scan (`🚀💪🔥` and others) in rendered strings: none. The only Unicode escapes used in render are `&#x14D;` (`ō`) and `&#x2190;` (`←` left-arrow on the morning ExitScreen home link). Both are typography, not emoji.
- First-person AI voice: `<Voice>` strings on both platforms are second-person/observational. The only `I`-anchored strings the user ever sees are inside Room 7's letter template (`I won't be perfect at remembering...`), which is **scripted, not freshly generated**, and is endorsed by the spec as the seed letter signed `— mellō`. (Room 7 is not implemented in code yet — see check C — so the question is moot for current UI.)

### Findings

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| (none) | — | — | — | — |

**Result for check D:** No forbidden patterns are reachable in any rendered screen at this commit.

---

## E. e2e voice-rules alignment

**Spec:** `e2e/fixtures/voice-rules.ts` should cover the canonical forbidden table from `character-bible.md`. No false positives. The helper `assertVoiceCompliant(page)` must scan rendered text and fail on matches.

### Coverage matrix (character-bible forbidden table → voice-rules.ts)

| Bible forbidden | In voice-rules.ts? |
|---|---|
| "You got this!" / "Let's crush it!" / "Amazing!" | yes (`you got this`, `crush it`, `let's crush`, `amazing`) |
| "Everything happens for a reason." | **MISSING** |
| "I'm sorry you're going through that. Have you tried..." | **MISSING** (`have you tried` not listed) |
| "As an AI, I..." | **MISSING** |
| "Here are 5 ways to..." (listicle voice) | **MISSING** |
| Bible verses dropped without invitation | not lintable here (semantic), out of scope |
| Multiple emojis | partial — only 🚀💪🔥 listed; no general emoji-class scan |
| Therapy-speak: "I'm hearing that you feel..." | **MISSING** (`i'm hearing` not listed) |
| "What if you tried journaling about it?" | **MISSING** |
| Pep talks of any kind | partial via `you got this`, `let's go`, `boost`, `supercharge`, `unlock`, `level up` |
| "Great question!" | yes (`great question`) |
| Diagnoses ("that sounds like anxiety") | **MISSING** |
| Hustle: `wonderful` | yes |

### Extra patterns in voice-rules.ts not from the bible (gold-plated, allowed):
`boost`, `supercharge`, `unlock`, `level up` — these are reasonable hustle-vocabulary extensions; consistent with the spirit of the bible. Keep.

### False positives / scope risks:

- `'unlock'` (line 38) is a forbidden literal substring. It would match accessibility copy like "unlock screen" or product copy about "unlocking the next room." For mellō's actual surface, none of those exist today — but the word is broad. Risk is medium for future drift; low for this commit.
- `'boost'` same concern (matches "boosted," "robust" → wait, ripgrep is substring not word, so `robust` contains `bust` not `boost`; `boost` is safer). Low risk.
- The exclamation regex `/(?<![\"'""'»)])\!/` on line 54 will NOT match `!` immediately after the listed closing-quote characters. That's the intent. But it WILL match `!` after letters, digits, spaces, em-dashes, periods — i.e., every "real" exclamation. Looks correct.
- The regex is anchored on rendered text only, but `getCheckableText` uses `body.innerText`. `innerText` returns rendered text excluding `display:none`. Good. It strips `<pre>` and `<code>` and `[data-allow-pattern="true"]`. Good. No false positive from rendered code blocks.

### Helper behavior (`assertVoiceCompliant`):

- Clones `document.body`, removes `<pre>`, `<code>`, `[data-allow-pattern="true"]` — correct.
- Falls back from `innerText` to `textContent`. `textContent` would include hidden-element text (display:none) which `innerText` excludes. The `??` fallback only triggers if `innerText` is undefined (it isn't on real browsers), so this is defensive dead code. Not a bug.
- Substring match is case-insensitive via `toLowerCase()` on both sides. Correct.
- Regex match force-adds `i` flag if not present. Correct.
- On failure, builds a multi-line message and asserts `violations.toHaveLength(0)`. The `expect(violations, message)` form is the Playwright soft-message API; valid.

### Findings

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| med | voice-rules.ts FORBIDDEN_PATTERNS missing "as an AI" | character-bible.md line 84 forbids `"As an AI, I..."` | Pattern not listed. | Add literal `'as an ai'` (case-insensitive substring). |
| med | voice-rules.ts missing therapy-speak `i'm hearing` | character-bible.md line 88 forbids `"I'm hearing that you feel..."` | Not listed. | Add `'i'm hearing'` (or regex `/i.?m hearing/i` to cover smart quotes). |
| med | voice-rules.ts missing "everything happens for a reason" | bible line 82 | Not listed. | Add literal. |
| med | voice-rules.ts missing "have you tried" | bible line 83 — advice-bypass | Not listed. | Add literal. |
| med | voice-rules.ts missing listicle voice `here are N ways` | bible line 85 | Not listed. | Add regex `/here are \d+ (ways|tips|steps)/i`. |
| med | voice-rules.ts missing diagnosis vocabulary `sounds like anxiety` etc. | bible line 92 | Not listed. | Add regex such as `/sounds like (anxiety|depression|trauma|bipolar|adhd)/i`. |
| low | voice-rules.ts missing journal-advice loop `what if you tried journaling` | bible line 89 | Not listed. | Add regex `/what if you tried/i`. |
| low | voice-rules.ts emoji coverage is shallow — only 🚀💪🔥 | bible line 87 forbids "Multiple emojis" generally | Three glyphs only. | Add a broad emoji range, e.g. `/\p{Extended_Pictographic}/u` (Node 16+ regex supports it). Currently a 🙏 (line 181 of bible's "we would NEVER say" example) or 😊 would pass the linter. |

**Result for check E:** Helper plumbing is correct. Pattern list is roughly two-thirds of the canonical forbidden table — meaningful gaps in AI-disclosure, therapy-speak, toxic-positivity, advice-bypass, listicle, and diagnosis.

---

## F. e2e test alignment after rename

**Spec:** `01-welcome.spec.ts` and `02-onboarding-room-1.spec.ts` should expect the new brand `mellō` and the new Room 1 copy.

### `01-welcome.spec.ts`

- Line 27: `await expect(page.locator('body')).toContainText('mellō');` — matches the rendered brand. **OK.**
- Lines 32–34: expects tagline `future self — a quieter way to grow`. **MISMATCH.** The actual rendered tagline (per spec and per code at `apps/web/app/page.tsx:14`) is `future self — a place to think slowly`. This test will fail when run.
- Line 38: `getByRole('button', { name: /begin/i })` — code wraps `<Link>` inside `<Button asChild>`, which renders an `<a>` element with the button styling. Role-based locator with `role: 'button'` may not match an anchor tag; `name: /begin/i` will match the text either way, but Playwright's `getByRole('button')` will not resolve to a link. **HIGH RISK MISMATCH.**

### `02-onboarding-room-1.spec.ts`

- Line 41: `await expect(body).toContainText(/hello[.,]?\s+i.?m\s+mell[oō]n/i);` — expects the OLD greeting `Hello. I'm mellō.` AND matches the OLD brand `mellōn`. The actual Room 1 step 1 voice is `Welcome.` per code line 30 and spec. **BLOCKER MISMATCH.**
- Line 49: `await expect(body).toContainText(/what should i call you/i);` — old copy. Actual is `Before anything else — what name do you go by?`. **BLOCKER MISMATCH.**
- Lines 71–74: expects `/thank you[,.]?\s+\w+|what brought you here today/i`. The current code emits `So — what brought you here today?` on step 2 — the second branch of the regex will match (substring `what brought you here today` is present). The first branch (`thank you, X`) is old-frame copy that has been removed and would never match the new copy. **PARTIAL MISMATCH — passes by the second branch only; left-branch is dead.**
- Line 87: same name-input locator. Should still find the `<input type="text">` on step 1. The locator chain `getByRole(...).first() || page.locator(...).first()` is bogus — `getByRole` returns a `Locator`, never a falsy value, so the `||` fallback is unreachable. In practice the role-based query (`name: /name|call you/i`) won't match the input because the input has only `placeholder="your name"` (apps/web/app/onboarding/room-1/page.tsx:47) — Playwright accessible-name does NOT derive from placeholder. **MED MISMATCH — test will likely fail to find the input.**

### Findings

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| blocker | 01-welcome.spec.ts:33 tagline assertion | `future self — a place to think slowly` | Asserts `future self — a quieter way to grow` | Update assertion string to match canonical tagline. |
| blocker | 02-onboarding-room-1.spec.ts:41 greeting regex | Room 1 step 1 = `Welcome.` (no first-person, no brand intro) | Asserts `/hello.*i.m.*mell[oō]n/i` | Replace with `/welcome\./i`. |
| blocker | 02-onboarding-room-1.spec.ts:49 name prompt | `Before anything else — what name do you go by?` | Asserts `/what should i call you/i` | Replace with `/what name do you go by/i`. |
| high | 01-welcome.spec.ts:38 button-role locator | Begin is an `<a>` (Link inside Button asChild). | `getByRole('button')` likely misses it. | Use `getByRole('link', { name: /begin/i })` or relax to `getByText(/^begin$/i)`. |
| med | 02-onboarding-room-1.spec.ts:61,86 name-input locator | Input has `placeholder="your name"`, no `aria-label`. | `getByRole('textbox', { name: /name|call you/i })` won't find it; the `||` fallback is unreachable. | Either add `aria-label="name"` to the input in the page, or change the locator to `page.locator('input[type="text"]').first()` (drop the `||`). |
| low | 02-onboarding-room-1.spec.ts:72 regex left-branch dead | The new copy never emits `Thank you, {name}`. | Regex still includes it. | Trim regex to `/what brought you here today/i`. |
| low | 02-onboarding-room-1.spec.ts:41 regex includes old brand `mell[oō]n` | Brand is `mellō`, never `mellōn`. | `mell[oō]n` allows the old form to pass. | Once the greeting is fixed, remove `[oō]n` artifact entirely. |

**Result for check F:** Both spec files are stale post-rename + reframe. Three blockers, two highs, two lows — every test that asserts copy will fail on the first run.

---

## G. Brand display unicode handling

**Spec:** The brand must render as `mellō` with the macron. Mobile uses `mell&#x14D;`; web uses direct UTF-8 `mellō`.

**Findings:**

- `apps/mobile/app/index.tsx:23` — `<Voice size="2xl">mell&#x14D;</Voice>`. In JSX/React Native, the entity `&#x14D;` is parsed by the JSX compiler to the literal Unicode code point U+014D (`ō`). It renders correctly inside React Native `<Text>` if the loaded font supports the glyph. Fraunces does. **OK.**
- `apps/web/app/page.tsx:11` — `<Voice ...>mellō</Voice>`. Direct UTF-8 literal. Requires the source file to be saved as UTF-8 (Next.js default) and Fraunces to support U+014D (it does). **OK.**
- `apps/web/app/layout.tsx:17` — `title: "mellō"` — direct UTF-8 inside metadata. Next.js serializes metadata to HTML head as UTF-8; browser tab and OG title will render correctly. **OK.**
- `apps/mobile/app.json:3` — `"name": "mellō"` — direct UTF-8 in the Expo manifest. Expo SDK 52 preserves UTF-8 here. **OK.**

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| (none) | — | — | — | — |

**Result for check G:** Both approaches survive the build. The mobile entity approach is defensible (immunizes against future editor encoding drift); the web direct-UTF-8 approach is cleaner. Either is fine.

---

## H. Persona modes framing in code

**Spec:** Persona modes are modes of the *practice*, not voices of a *being*. UI/code should not push first-person AI voice into affordances or labels.

**Findings:**

- ripgrep for `Companion mode|Witness mode|Counselor mode|Scribe mode|Future Self mode` across `apps/` → **no matches**. The product surface does not name modes.
- The voice primitives (`Voice`, `Whisper`, `Pulse`, `Sanctuary`, `Threshold`) are typographic/layout abstractions, not personalities. Comments treat them as such:
  - `apps/mobile/lib/voice/Voice.tsx:11` — comment: *"mellō's primary text voice. Fraunces serif, generous leading. Used for all AI-generated copy."* Borderline — calls it a "voice" but the framing is typographic, not "voice of a being." Acceptable.
  - `apps/web/components/voice/Sanctuary.tsx` — no first-person framing in comments.
  - `apps/mobile/lib/voice/Sanctuary.tsx:9` — comment: *"the root container for mellō screens."* Neutral.
  - `apps/mobile/app/index.tsx:19` — comment: *"mellō breathes gently while the user arrives."* Anthropomorphic in a *comment*. Comments are not user-visible; mild aesthetic concern only.
- No UI label references "Companion," "Counselor," "Future Self," or "Witness." The morning ritual surfaces no mode badge.

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| low | apps/mobile/app/index.tsx:19 (comment) | Practice is a verb the user enters; mellō does not address as a being. | Comment "mellō breathes gently" personifies. | Cosmetic. Reword to "title animates gently" if a future copy editor cares. Not user-visible. |

**Result for check H:** No persona-as-being labels in UI. One minor anthropomorphism in a code comment.

---

## I. Voice primitives consistency

**Web:** `components/voice/{Sanctuary,Voice,Whisper,Pulse,Threshold}.tsx`
**Mobile:** `lib/voice/{Sanctuary,Voice,Whisper,Pulse}.tsx` (no Threshold)

### Tokens

- Web (`apps/web/tailwind.config.ts:11-17`):
  - `bone: #F4EFE6`, `oat: #E5DCC8`, `vellum: #FAF6EE`, `deepInk: #1A1814`, `dawn: #C2906B`
- Mobile (`apps/mobile/lib/voice/tokens.ts:5-10`):
  - `bone: #F4EFE6`, `oat: #E5DCC8`, `vellum: #FAF6EE`, `deepInk: #1A1814`, `dawn: #C2906B`

**Match — bit-identical.** Mobile tokens file even carries a comment "Mirror of web palette. Do not diverge without updating both."

### Component parity

| Primitive | Web behavior | Mobile behavior | Match |
|---|---|---|---|
| Sanctuary | `<main>` with `mx-auto max-w-[600px] px-8 py-24 min-h-screen flex items-center justify-center` | `<View>` with `flex:1`, `vellum` bg, `maxWidth: 480`, centered, `paddingHorizontal: spacing.lg`, `paddingVertical: spacing.xl` | conceptually identical; max-width differs (600 vs 480) |
| Voice | `<p>` Fraunces serif, `text-xl leading-relaxed text-deepInk` | `<Text>` Fraunces, default lg=20pt, lineHeight `relaxed (30)`, deepInk | conceptually identical; web has one size, mobile has `lg/xl/2xl` |
| Whisper | `<span>` Fraunces italic, `text-sm text-deepInk/60` | `<Text>` Fraunces italic, fontSize.xs (12), `deepInk + '99'` (60% alpha) | match (web `text-sm`=14, mobile xs=12 — mild divergence) |
| Pulse | framer-motion opacity `[0.6, 1, 0.6]` over 4s ease-in-out infinite | reanimated `withRepeat(withTiming(1.0, 2000, easeInOut), -1, true)` from 0.6 | match (both 0.6↔1.0, 4s total cycle) |
| Threshold | full-screen vellum/90 overlay with fade in/out | **missing** | divergence |

### Findings

| Severity | Item | What spec implies | What code shows | Recommended fix |
|---|---|---|---|---|
| low | maxWidth divergence (web 600 vs mobile 480) | Mirror palette implies mirror layout intent. | 600 vs 480 px. | Justifiable: web is desktop-friendly, mobile is phone-bounded. Document the intentional difference. |
| low | Whisper font-size divergence (web 14 vs mobile 12) | Mirror. | 14px on web, 12px on mobile. | Either align (recommend 13–14 on both) or document. Mobile screens are smaller so 12px is readable; defensible. |
| low | Voice size variants asymmetry | Mirror. | Web exposes one size, mobile exposes `lg/xl/2xl`. | Add size variants to web Voice for parity, or simplify mobile to one size and rely on style overrides. |
| med | Threshold missing on mobile | Web Threshold is a modal overlay primitive. Mobile may need an equivalent for crisis frame, future-self letter reveals, etc. | Not implemented. | Build a mobile `lib/voice/Threshold.tsx` before any modal-needing surface ships (crisis frame is the loudest example — it MUST be reliably presentable). |

**Result for check I:** Tokens are bit-identical. Components carry the same intent. Threshold is the one real gap; size scales and max-widths are defensible drift.

---

## J. No analytics, no virality

**Spec:** No analytics (Vercel Analytics, PostHog, Mixpanel, Segment), no OpenGraph virality push, no share buttons, no social SDK imports.

### Method
- ripgrep `analytics|posthog|mixpanel|segment|@vercel/analytics|gtag|fbevents|share|opengraph|og:|twitter:card` across `apps/`.
- Inspect `package.json` dependency lists.
- Inspect `next.config.mjs`, `app/layout.tsx` metadata, `app.json`.

### Findings

- Web `package.json`: dependencies are `next`, `react`, `react-dom`, `framer-motion`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`. **No analytics or social SDK.**
- Mobile `package.json`: `expo`, `expo-router`, `expo-font`, `expo-haptics`, `expo-status-bar`, `expo-splash-screen`, `expo-linking`, `expo-constants`, `react`, `react-native`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`, `@expo-google-fonts/fraunces`, `@react-navigation/native`. **No analytics or social SDK.**
- `apps/web/next.config.mjs` is empty: `const nextConfig = {}`. No analytics middleware.
- `apps/web/app/layout.tsx` metadata only sets `title` and `description`. No `openGraph`, `twitter`, `metadataBase`. No social cards configured.
- ripgrep for `share|opengraph|og:|twitter:card|analytics|gtag|posthog|mixpanel`: only hits are the substring `share` inside Room 1 step 2 copy (`Nothing said here is shared with anyone`) — that's data-privacy language, not a share button. No share UI affordance exists.
- `apps/mobile/README.md:51` explicitly states: *"No emojis. No exclamation points. No streaks. No analytics."*

| Severity | Item | What spec says | What code says | Recommended fix |
|---|---|---|---|---|
| (none) | — | — | — | — |

**Result for check J:** Zero analytics. Zero social SDK. Zero share affordance. Zero OpenGraph virality push. Clean.

---

## Rollup

### Mismatches by severity

| Severity | Count |
|---|---|
| Blocker | 3 |
| High | 2 |
| Medium | 8 |
| Low | 10 |
| **Total** | **23** |

### Top-3 to fix before any UI is shown to a real user

1. **`e2e/tests/02-onboarding-room-1.spec.ts` lines 41 & 49 — assertions test the OLD copy (`Hello. I'm mellō.`, `what should I call you`).** These will fail on the very first run, locking the test gate in a red state. Both blockers. Fix to canonical strings: `/welcome\./i` and `/what name do you go by/i`. Also remove the `[oō]n` artifact from the brand regex.

2. **`e2e/tests/01-welcome.spec.ts` line 33 — tagline assertion is `future self — a quieter way to grow` but the rendered copy is `future self — a place to think slowly`.** Blocker. Update to the canonical tagline. While there, change the button locator on line 38 from `getByRole('button', { name: /begin/i })` to `getByRole('link', { name: /begin/i })` since the web Begin is an anchor.

3. **`apps/mobile/app/index.tsx:45` — Begin button skips all 7 onboarding rooms and dumps the user straight into the morning ritual.** High. Identity is supposed to be captured by Room 7's seed letter before any ritual surface is reachable. The mobile app should either (a) build a parity Room 1 (and beyond) at `app/(onboarding)/room-1.tsx`, or (b) be explicitly documented as Phase-0 "web is the onboarding home; mobile is ritual-only" until parity ships. Right now mobile silently breaks the design contract.

### Secondary recommendations (medium priority, not blockers)

- Extend `e2e/fixtures/voice-rules.ts` FORBIDDEN_PATTERNS to include the six missing bible patterns (`as an ai`, `i'm hearing`, `everything happens for a reason`, `have you tried`, listicle-N-ways regex, diagnosis regex) and broaden emoji detection to `/\p{Extended_Pictographic}/u`.
- Wire `apps/web/app/onboarding/room-1/page.tsx:114-122` step-3 continue button to a real next route or a placeholder (currently `onClick={() => {}}`).
- Build mobile `lib/voice/Threshold.tsx` before any modal-style surface ships (crisis frame in particular).

### Anything notable that is RIGHT

- Welcome screen copy: bit-perfect on both platforms.
- Web Room 1 copy: bit-perfect through all three implemented steps. The Thou-leaks listed in the brief (`Hello. I'm mellō.`, `I'll hold it carefully`, etc.) are completely absent from the code.
- Zero analytics, zero social SDK, zero share button — the anti-virality stance is real, not aspirational.
- Tokens are bit-identical across web and mobile. The palette is honored as a contract.
- No exclamation points in user-facing strings on either platform.
- No first-person AI voice in any rendered string.
- Brand `mellōn` (macron + n) is completely purged from user-facing surfaces.

### Closing note

The voice IS the product. At the copy layer, the web frontend is honest — the new practice-voice frame is faithfully encoded. The drift is concentrated in (a) the test suite, which still asserts the old being-voice copy and would block CI as soon as it runs, and (b) the mobile app, which has no onboarding at all. Both are tractable; neither implies the voice work itself drifted. The audit found no Thou-leaks in the rendered web UI.

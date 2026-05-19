# mellō — End-to-End Tests

Playwright tests for the mellō web app.
Written against the expected structure defined in `voice/onboarding-script.md`.

## Prerequisites

The web app must be running at `http://localhost:3000` before executing tests.

From the repo root:

```bash
cd apps/web
npm install
npm run dev
```

## Running tests

```bash
# From this directory (e2e/)
npm install
npx playwright install chromium
npm test
```

To run in headed mode (watch the browser):

```bash
npm run test:headed
```

To run a single spec:

```bash
npx playwright test tests/01-welcome.spec.ts
```

## If the web app is not yet running

Playwright will report a `ECONNREFUSED` connection error on the first test.
This is expected during Phase 0 / scaffolding. The tests are written against
the specified contract — they will pass once the web app exposes the correct routes.

## Structure

```
e2e/
├── fixtures/
│   └── voice-rules.ts          FORBIDDEN_PATTERNS + assertVoiceCompliant()
├── tests/
│   ├── 01-welcome.spec.ts      Welcome screen (/, Pre-room)
│   └── 02-onboarding-room-1.spec.ts   Room 1 — Arrival
├── playwright.config.ts        Points at localhost:3000, chromium only (MVP)
├── tsconfig.json
└── package.json
```

## The voice-compliance helper

`fixtures/voice-rules.ts` is the most important file in this directory.

`assertVoiceCompliant(page)` scans all visible page text and fails if any
forbidden phrase reaches the screen — exclamation points outside direct quotes,
hustle-culture phrases ("amazing", "crush", "you got this", "let's go",
"boost", "supercharge", "unlock", "level up"), hollow openers ("great
question", "wonderful"), and the specific emoji banned in the character bible
(🚀 💪 🔥).

Text inside `<pre>`, `<code>`, or elements with `data-allow-pattern="true"` is
excluded from scanning.

The rules are derived directly from `voice/character-bible.md`. Any change to
that document should be reflected here.

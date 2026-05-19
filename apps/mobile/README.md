# mellō — mobile

Expo SDK 52 app with TypeScript and Expo Router.

## Prerequisites

- Node 18+
- Expo Go app on device, or iOS/Android simulator

## Run locally

```sh
npm install
npx expo start --tunnel
# press i (iOS sim) / a (Android sim) / scan QR with Expo Go
```

## TypeScript check

```sh
npx tsc --noEmit
```

## Project structure

```
app/
  _layout.tsx          Root layout — Fraunces font loading via expo-google-fonts, Stack navigator
  index.tsx            Welcome screen (Pre-room from onboarding-script.md)
  (rituals)/
    _layout.tsx        Rituals group layout
    morning.tsx        Morning ritual — mood pulse + optional intention + save

lib/voice/
  tokens.ts            Design tokens (colors, typography, spacing)
  Sanctuary.tsx        Root screen container — vellum background, centered
  Voice.tsx            Fraunces_400Regular serif — AI voice text
  Whisper.tsx          Fraunces_400Regular_Italic, small, deepInk at 60% opacity
  Pulse.tsx            Reanimated v3 soft breathing animation (opacity 0.6–1.0, 4s)
  index.ts             Re-exports all primitives
```

## Design constraints

- Background: vellum `#FAF6EE` — no blues
- Accent: dawn `#C2906B`
- AI voice: Fraunces (loaded via `@expo-google-fonts/fraunces`)
- UI labels: system grotesque
- Motion: `Easing.inOut(Easing.ease)` only — no springs
- Haptics: one `ImpactFeedbackStyle.Light` on morning save — nowhere else
- No emojis. No exclamation points. No streaks. No analytics.

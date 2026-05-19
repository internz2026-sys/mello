// mellō design tokens — mobile
// Mirror of web palette. Do not diverge without updating both.

export const colors = {
  bone: '#F4EFE6',
  oat: '#E5DCC8',
  vellum: '#FAF6EE',
  deepInk: '#1A1814',
  dawn: '#C2906B',
} as const;

export type Color = keyof typeof colors;

// Typography
export const fonts = {
  // Registered by @expo-google-fonts/fraunces via useFonts in _layout.tsx
  serif: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_400Regular_Italic',
  // System grotesque — falls back to platform default sans-serif
  ui: undefined as string | undefined,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 28,
  '2xl': 36,
} as const;

export const lineHeights = {
  tight: 20,
  normal: 24,
  relaxed: 30,   // AI voice default — generous leading for Fraunces
  loose: 40,
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  full: 9999,
} as const;

export const maxWidth = 480;

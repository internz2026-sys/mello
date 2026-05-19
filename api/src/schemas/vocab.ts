// Mirrors voice/memory-taxonomy.md v0.2 — keep in sync.
// Centralised vocabularies for memory kind / stability / sensitivity / emotion / theme.
// Any vocabulary change here MUST be reflected in:
//   - backend/migrations/0005_memories.sql (Postgres enums)
//   - distiller/distiller.py (system prompt)
//   - voice/memory-taxonomy.md (canonical doc, bump version)

import { z } from 'zod';

// v0.2: dropped 'spiritual' (spirituality is a layer via spiritual_themes[],
// not a kind); added 'gladness' (recurring sources of joy/life/affection).
export const MemoryKind = z.enum([
  'identity',
  'pattern',
  'value',
  'relationship',
  'fear',
  'hope',
  'wound',
  'gladness',
  'commitment',
]);
export type MemoryKind = z.infer<typeof MemoryKind>;

export const MemoryStability = z.enum(['stable', 'evolving', 'volatile']);
export type MemoryStability = z.infer<typeof MemoryStability>;

export const MemorySensitivity = z.enum(['normal', 'tender', 'sealed']);
export type MemorySensitivity = z.infer<typeof MemorySensitivity>;

// v0.2 dedup rule: 'hope' is a kind, not an emotion or spiritual theme.
// Each word lives in exactly one vocabulary field so retrieval can't
// double-count the same concept.
export const Emotion = z.enum([
  // Heavy
  'grief', 'loneliness', 'shame', 'fear', 'dread', 'despair', 'regret', 'anger', 'bitterness', 'numbness',
  // Tender
  'tiredness', 'sadness', 'disappointment', 'worry', 'longing', 'tenderness', 'vulnerability', 'nostalgia',
  // Mid
  'restlessness', 'confusion', 'frustration', 'boredom', 'ambivalence',
  // Warm
  'gratitude', 'joy', 'peace', 'wonder', 'affection', 'contentment', 'relief', 'awe',
  // Engaged
  'curiosity', 'determination', 'delight',
]);
export type Emotion = z.infer<typeof Emotion>;

// Theme strings are kept as a string (rather than a hard enum) so future
// vocab versions don't break old rows. Validation against the active vocab
// happens in the distiller layer, not at the HTTP boundary.
export const Theme = z.string().min(1).max(64);

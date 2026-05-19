import { z } from 'zod';
import { Emotion, MemoryKind, MemorySensitivity, MemoryStability, Theme } from './vocab';

// Mirrors the Distiller output schema in voice/memory-taxonomy.md.
export const MemorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: MemoryKind,
  stability: MemoryStability,
  sensitivity: MemorySensitivity,
  summary: z.string().max(800),
  evidence: z.array(z.string()).max(20),
  emotions: z.array(Emotion).max(3),
  themes: z.array(Theme).max(4),
  relationships: z.array(z.string()).max(10),
  spiritual_themes: z.array(z.string()).max(6),
  importance: z.number().min(0).max(1),
  identity_weight: z.number().min(0).max(1),
  first_observed_at: z.string().datetime(),
  last_reinforced_at: z.string().datetime(),
  vocab_version: z.string().default('0.2'),
});
export type Memory = z.infer<typeof MemorySchema>;

export const ListMemoriesQuerySchema = z
  .object({
    kind: MemoryKind.optional(),
    theme: Theme.optional(),
    emotion: Emotion.optional(),
    include_sealed: z.coerce.boolean().default(false),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    cursor: z.string().datetime().optional(),
  })
  .strict();
export type ListMemoriesQuery = z.infer<typeof ListMemoriesQuerySchema>;

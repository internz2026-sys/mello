import { z } from 'zod';
import { MemorySchema } from './memory.schema';

export const RetrieveInputSchema = z
  .object({
    query: z.string().min(1).max(2_000),
    top_k: z.coerce.number().int().min(1).max(20).default(8),
    include_sealed: z.coerce.boolean().default(false),
  })
  .strict();
export type RetrieveInput = z.infer<typeof RetrieveInputSchema>;

export const RetrievedMemorySchema = MemorySchema.extend({
  score: z.number(),
  cosine_similarity: z.number().optional(),
});
export type RetrievedMemory = z.infer<typeof RetrievedMemorySchema>;

export const RetrieveResponseSchema = z.object({
  query: z.string(),
  results: z.array(RetrievedMemorySchema),
  retrieved_at: z.string().datetime(),
});
export type RetrieveResponse = z.infer<typeof RetrieveResponseSchema>;

import { z } from 'zod';

// A "future self" is a named version of who the user is trying to become.
export const FutureSelfSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  label: z.string(),
  horizon_months: z.number().int().min(1).max(120),
  description: z.string().nullable(),
  values: z.array(z.string()).max(10),
  created_at: z.string().datetime(),
  retired_at: z.string().datetime().nullable(),
});
export type FutureSelf = z.infer<typeof FutureSelfSchema>;

// A "future letter" is a written exchange between present and future self.
export const FutureLetterSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  future_self_id: z.string().uuid(),
  direction: z.enum(['to_future', 'from_future']),
  body: z.string(),
  deliver_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type FutureLetter = z.infer<typeof FutureLetterSchema>;

export const CreateFutureLetterSchema = z
  .object({
    future_self_id: z.string().uuid(),
    direction: z.enum(['to_future', 'from_future']),
    body: z.string().min(1).max(20_000),
    deliver_at: z.string().datetime().optional(),
  })
  .strict();
export type CreateFutureLetterInput = z.infer<typeof CreateFutureLetterSchema>;

export const ListFutureLettersQuerySchema = z
  .object({
    future_self_id: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().datetime().optional(),
  })
  .strict();
export type ListFutureLettersQuery = z.infer<typeof ListFutureLettersQuerySchema>;

import { z } from 'zod';

export const NotificationWindowSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  max_per_day: z.number().int().min(0).max(3),
});
export type NotificationWindow = z.infer<typeof NotificationWindowSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string().nullable(),
  timezone: z.string(),
  spiritual_opt_in: z.boolean(),
  spiritual_tradition: z.string().nullable(),
  notification_window: NotificationWindowSchema,
  data_retention_policy: z.enum(['keep', '1y', '5y', 'delete-on-request']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const PatchProfileSchema = z
  .object({
    display_name: z.string().min(1).max(120).nullable().optional(),
    timezone: z.string().optional(),
    spiritual_opt_in: z.boolean().optional(),
    spiritual_tradition: z.string().max(120).nullable().optional(),
    notification_window: NotificationWindowSchema.optional(),
    data_retention_policy: z
      .enum(['keep', '1y', '5y', 'delete-on-request'])
      .optional(),
  })
  .strict();
export type PatchProfileInput = z.infer<typeof PatchProfileSchema>;

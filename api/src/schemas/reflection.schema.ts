// Mirrors backend/migrations/0004_episodic.sql — column names and types
// match the DB exactly so the controllers can pass values straight through.
// If you add/rename a column in the SQL, update both sides here.

import { z } from 'zod';
import { Emotion } from './vocab';

// Journal entry kind enum — mirrors public.journal_kind in 0004_episodic.sql.
export const JournalKind = z.enum([
  'text',
  'voice',
  'prompted',
  'quick',
  'dream',
  'letter_to_self',
]);
export type JournalKind = z.infer<typeof JournalKind>;

// Journal entries — raw, first-person writing the user produces.
//
// DB shape (0004_episodic.sql):
//   id uuid pk, user_id uuid not null, kind journal_kind default 'text',
//   content_text text nullable, content_audio_url text nullable,
//   raw_mood int nullable (1..10), mood_words text[] default '{}',
//   processed_at timestamptz nullable, created_at timestamptz default now()
//
// CHECK (journal_entries_has_content): at least one of content_text /
// content_audio_url must be non-null.
export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: JournalKind,
  content_text: z.string().nullable(),
  content_audio_url: z.string().nullable(),
  raw_mood: z.number().int().min(1).max(10).nullable(),
  // mood_words capped at 6 here intentionally — the cap on
  // memories.emotions[] (max 3) is a separate, downstream constraint.
  // See voice/memory-taxonomy.md vocabulary cardinality notes.
  mood_words: z.array(Emotion).max(6),
  processed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const CreateJournalEntrySchema = z
  .object({
    kind: JournalKind.optional(),
    content_text: z.string().min(1).max(20_000).optional(),
    content_audio_url: z.string().url().max(2_048).optional(),
    raw_mood: z.number().int().min(1).max(10).optional(),
    mood_words: z.array(Emotion).max(6).optional(),
  })
  .strict()
  .refine(
    (v) => Boolean(v.content_text) || Boolean(v.content_audio_url),
    { message: 'content_text or content_audio_url is required' },
  );
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

export const ListJournalEntriesQuerySchema = z
  .object({
    kind: JournalKind.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().datetime().optional(),
  })
  .strict();
export type ListJournalEntriesQuery = z.infer<typeof ListJournalEntriesQuerySchema>;

// Chat role enum — mirrors public.chat_role in 0004_episodic.sql.
// Includes 'system' so privileged/system messages survive the API boundary.
export const ChatRole = z.enum(['user', 'assistant', 'system']);
export type ChatRole = z.infer<typeof ChatRole>;

// Chat messages — turn-by-turn conversation log (not the distilled memory).
//
// DB shape (0004_episodic.sql):
//   id uuid pk, user_id uuid not null, session_id uuid not null,
//   role chat_role not null, content text not null,
//   token_count int nullable, created_at timestamptz default now()
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: ChatRole,
  content: z.string(),
  token_count: z.number().int().nonnegative().nullable(),
  created_at: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const CreateChatMessageSchema = z
  .object({
    session_id: z.string().uuid(),
    role: ChatRole.default('user'),
    content: z.string().min(1).max(10_000),
  })
  .strict();
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>;

export const ListChatMessagesQuerySchema = z
  .object({
    session_id: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    cursor: z.string().datetime().optional(),
  })
  .strict();
export type ListChatMessagesQuery = z.infer<typeof ListChatMessagesQuerySchema>;

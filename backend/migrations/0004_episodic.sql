-- 0004_episodic.sql
-- Episodic store: journal_entries + chat_messages
--
-- "Episodic" is the raw record. Memories (semantic) are derived from these.
-- The distiller reads journal_entries, produces memories, and references the
-- source entry ids in memories.evidence[].

create type public.journal_kind as enum ('text','voice','prompted','quick','dream','letter_to_self');

create table if not exists public.journal_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  kind               public.journal_kind not null default 'text',
  content_text       text,
  content_audio_url  text,
  raw_mood           int check (raw_mood between 1 and 10),  -- 1..10 slider
  mood_words         text[] not null default '{}',           -- from emotion vocabulary
  processed_at       timestamptz,                            -- when distiller last touched it
  created_at         timestamptz not null default now()
);

-- ensure something was written
alter table public.journal_entries
  add constraint journal_entries_has_content
  check (content_text is not null or content_audio_url is not null);

create index if not exists journal_entries_user_id_idx       on public.journal_entries (user_id);
create index if not exists journal_entries_created_at_idx    on public.journal_entries (created_at desc);
create index if not exists journal_entries_user_created_idx  on public.journal_entries (user_id, created_at desc);
create index if not exists journal_entries_kind_idx          on public.journal_entries (kind);
create index if not exists journal_entries_processed_at_idx  on public.journal_entries (processed_at) where processed_at is null;
create index if not exists journal_entries_mood_words_idx    on public.journal_entries using gin (mood_words);

alter table public.journal_entries enable row level security;

drop policy if exists journal_entries_select on public.journal_entries;
create policy journal_entries_select on public.journal_entries
  for select using (user_id = auth.uid());

drop policy if exists journal_entries_insert on public.journal_entries;
create policy journal_entries_insert on public.journal_entries
  for insert with check (user_id = auth.uid());

drop policy if exists journal_entries_update on public.journal_entries;
create policy journal_entries_update on public.journal_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists journal_entries_delete on public.journal_entries;
create policy journal_entries_delete on public.journal_entries
  for delete using (user_id = auth.uid());

-- chat_messages: turns in a session with mellō
create type public.chat_role as enum ('user','assistant','system');

create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  session_id    uuid not null,                              -- groups a conversation; no separate sessions table yet
  role          public.chat_role not null,
  content       text not null,
  token_count   int,
  created_at    timestamptz not null default now()
);

create index if not exists chat_messages_user_id_idx        on public.chat_messages (user_id);
create index if not exists chat_messages_session_id_idx     on public.chat_messages (session_id);
create index if not exists chat_messages_user_created_idx   on public.chat_messages (user_id, created_at desc);
create index if not exists chat_messages_session_created_idx on public.chat_messages (session_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
  for select using (user_id = auth.uid());

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
  for insert with check (user_id = auth.uid());

drop policy if exists chat_messages_update on public.chat_messages;
create policy chat_messages_update on public.chat_messages
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages
  for delete using (user_id = auth.uid());

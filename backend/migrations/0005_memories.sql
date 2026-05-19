-- 0005_memories.sql
-- Semantic memory store
--
-- This table mirrors voice/memory-taxonomy.md exactly. The Distiller writes
-- here; the Retriever reads here (joined with Qdrant via qdrant_point_id).
--
-- Enums match the taxonomy 1:1. Changing them is a breaking change — see
-- memory-taxonomy.md "Versioning" section.
--
-- v0.2 alignment (2026-05-16): memory_kind drops 'spiritual' (spirituality is
-- a *layer* on top of any kind, identified by non-empty spiritual_themes[],
-- not a separate kind) and adds 'gladness' (a recurring source of joy, life,
-- or affection). Precedence between kinds is enforced by the Distiller, not
-- by a DB constraint — kept that way intentionally.

create type public.memory_kind as enum (
  'identity','pattern','value','relationship','fear','hope','wound','commitment','gladness'
);

create type public.memory_stability  as enum ('stable','evolving','volatile');
create type public.memory_sensitivity as enum ('normal','tender','sealed');

create table if not exists public.memories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,

  kind                public.memory_kind        not null,
  stability           public.memory_stability   not null,
  sensitivity         public.memory_sensitivity not null default 'normal',

  -- distiller is forbidden from writing summaries longer than ~3 sentences
  -- (enforced by prompt; soft length cap here as a safety net)
  summary             text not null check (char_length(summary) <= 1200),

  evidence            uuid[] not null default '{}',          -- references journal_entries.id
  emotions            text[] not null default '{}',          -- max 3 (enforced in app + check below)
  themes              text[] not null default '{}',          -- max 4
  relationships       text[] not null default '{}',          -- names as user referred to them
  spiritual_themes    text[],                                -- nullable; only populated if spiritual_opt_in

  importance          numeric(3,2) not null default 0.50 check (importance       between 0 and 1),
  identity_weight     numeric(3,2) not null default 0.30 check (identity_weight  between 0 and 1),
  recurrence          int          not null default 1   check (recurrence >= 0),

  qdrant_point_id     text unique,                           -- linkage to Qdrant vector

  vocab_version       text not null default '0.2',           -- memory-taxonomy.md version

  first_observed_at   timestamptz not null default now(),
  last_reinforced_at  timestamptz not null default now(),
  contradicted_at     timestamptz,                           -- set when distiller detects contradiction

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint memories_emotions_max_3 check (cardinality(emotions) <= 3),
  constraint memories_themes_max_4   check (cardinality(themes)   <= 4)
);

-- Hot paths
create index if not exists memories_user_id_idx           on public.memories (user_id);
create index if not exists memories_created_at_idx        on public.memories (created_at desc);
create index if not exists memories_kind_idx              on public.memories (kind);
create index if not exists memories_stability_idx         on public.memories (stability);

-- Sealed-memory filter must be cheap — retrieval default is "exclude sealed"
create index if not exists memories_sensitivity_idx       on public.memories (sensitivity);
create index if not exists memories_user_unsealed_idx
  on public.memories (user_id, last_reinforced_at desc)
  where sensitivity <> 'sealed';

-- Re-ranking signals
create index if not exists memories_importance_idx        on public.memories (importance desc);
create index if not exists memories_last_reinforced_idx   on public.memories (last_reinforced_at desc);
create index if not exists memories_user_kind_idx         on public.memories (user_id, kind);

-- Array filters
create index if not exists memories_themes_idx            on public.memories using gin (themes);
create index if not exists memories_emotions_idx          on public.memories using gin (emotions);
create index if not exists memories_relationships_idx     on public.memories using gin (relationships);
create index if not exists memories_evidence_idx          on public.memories using gin (evidence);

alter table public.memories enable row level security;

drop policy if exists memories_select on public.memories;
create policy memories_select on public.memories
  for select using (user_id = auth.uid());

drop policy if exists memories_insert on public.memories;
create policy memories_insert on public.memories
  for insert with check (user_id = auth.uid());

drop policy if exists memories_update on public.memories;
create policy memories_update on public.memories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists memories_delete on public.memories;
create policy memories_delete on public.memories
  for delete using (user_id = auth.uid());

-- Convenience view for the Retriever: unsealed memories only.
-- Retrieval rules: sealed memories are only surfaced when the user explicitly
-- invokes them — never proactive. The view enforces the default.
create or replace view public.memories_retrievable as
  select * from public.memories where sensitivity <> 'sealed';

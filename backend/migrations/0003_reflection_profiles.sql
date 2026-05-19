-- 0003_reflection_profiles.sql
-- reflection_profiles
--
-- A versioned, snapshot-style summary of the user's interior landscape. The
-- distiller (Opus) writes a new version periodically; older versions are kept
-- so we can show the user how they've changed over time.
--
-- domains      : free-form jsonb (work/family/spirit/body/etc weights)
-- values       : declared values ("honesty", "kindness")
-- current_burdens / hopes / fears: short text arrays surfaced from memories
-- version      : monotonically increasing per-user

create table if not exists public.reflection_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  version          int  not null default 1,
  domains          jsonb not null default '{}'::jsonb,
  values           text[] not null default '{}',
  current_burdens  text[] not null default '{}',
  hopes            text[] not null default '{}',
  fears            text[] not null default '{}',
  generated_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (user_id, version)
);

create index if not exists reflection_profiles_user_id_idx     on public.reflection_profiles (user_id);
create index if not exists reflection_profiles_created_at_idx  on public.reflection_profiles (created_at desc);
create index if not exists reflection_profiles_user_version_idx
  on public.reflection_profiles (user_id, version desc);

alter table public.reflection_profiles enable row level security;

drop policy if exists reflection_profiles_select on public.reflection_profiles;
create policy reflection_profiles_select on public.reflection_profiles
  for select using (user_id = auth.uid());

drop policy if exists reflection_profiles_insert on public.reflection_profiles;
create policy reflection_profiles_insert on public.reflection_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists reflection_profiles_update on public.reflection_profiles;
create policy reflection_profiles_update on public.reflection_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reflection_profiles_delete on public.reflection_profiles;
create policy reflection_profiles_delete on public.reflection_profiles
  for delete using (user_id = auth.uid());

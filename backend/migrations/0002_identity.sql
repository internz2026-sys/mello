-- 0002_identity.sql
-- Identity: users + profiles
--
-- `users` is a thin local mirror of auth.users. In Supabase, auth.users is
-- managed by GoTrue; we keep a public.users row keyed by the same UUID so
-- foreign keys from app tables don't reach into the auth schema (which is
-- considered private API).
--
-- `profiles` carries the soft, opt-in attributes: spiritual layer, notification
-- window, data retention policy.

create table if not exists public.users (
  id            uuid primary key,                          -- mirrors auth.users.id
  email         citext unique,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz                                -- soft delete; cascade is on export
);

create index if not exists users_created_at_idx on public.users (created_at desc);

create table if not exists public.profiles (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references public.users(id) on delete cascade,
  display_name             text,
  timezone                 text not null default 'UTC',
  spiritual_opt_in         boolean not null default false,
  spiritual_tradition      text,                            -- nullable; free text, user-described
  notification_window      jsonb not null default jsonb_build_object(
                             'start', '09:00',
                             'end',   '21:00',
                             'max_per_day', 1
                           ),
  data_retention_policy    text not null default 'keep'     -- keep | 1y | 5y | delete-on-request
                             check (data_retention_policy in ('keep','1y','5y','delete-on-request')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists profiles_user_id_idx       on public.profiles (user_id);
create index if not exists profiles_created_at_idx    on public.profiles (created_at desc);
create index if not exists profiles_spiritual_opt_in_idx on public.profiles (spiritual_opt_in) where spiritual_opt_in = true;

-- RLS
alter table public.users     enable row level security;
alter table public.profiles  enable row level security;

-- users: a row is "yours" iff its id is your auth.uid()
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (id = auth.uid());

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (id = auth.uid());

-- INSERT into public.users is normally driven by a Supabase auth trigger;
-- we still expose a self-insert policy so the API layer can upsert.
drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert with check (id = auth.uid());

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (user_id = auth.uid());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (user_id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (user_id = auth.uid());

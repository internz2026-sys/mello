-- 0008_people.sql
-- people
--
-- The user's named relationships. `memories.relationships[]` carries the
-- names as text (as the user referred to them); this table is the canonical
-- list with roles and a "last touched" signal so mellō can gently surface
-- "you haven't mentioned dad in three months".

create table if not exists public.people (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  name              text not null,                         -- name as user refers to them
  role              text,                                  -- "father", "best friend", "coworker"
  importance        numeric(3,2) not null default 0.50 check (importance between 0 and 1),
  last_touched_at   timestamptz,                           -- last mention in a journal entry
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists people_user_id_idx         on public.people (user_id);
create index if not exists people_created_at_idx      on public.people (created_at desc);
create index if not exists people_last_touched_idx    on public.people (user_id, last_touched_at desc nulls last);
create index if not exists people_name_trgm_idx       on public.people using gin (name gin_trgm_ops);

alter table public.people enable row level security;

drop policy if exists people_select on public.people;
create policy people_select on public.people
  for select using (user_id = auth.uid());

drop policy if exists people_insert on public.people;
create policy people_insert on public.people
  for insert with check (user_id = auth.uid());

drop policy if exists people_update on public.people;
create policy people_update on public.people
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists people_delete on public.people;
create policy people_delete on public.people
  for delete using (user_id = auth.uid());

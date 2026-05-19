-- 0006_future_self.sql
-- Future Self: future_selves + future_letters
--
-- A `future_self` is a generated persona at a horizon (1y, 5y, 10y, elder,
-- legacy). The user can edit it — `user_edits` overlays `generated_persona`.
--
-- `future_letters` are messages written from a future self to the present user,
-- queued for delivery at a specific occasion.

create type public.future_horizon as enum ('1y','5y','10y','elder','legacy');

create table if not exists public.future_selves (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  horizon             public.future_horizon not null,
  generated_persona   jsonb not null,                   -- model output: voice, values, daily texture
  user_edits          jsonb not null default '{}'::jsonb, -- user overrides on top of generated
  generated_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, horizon)                              -- one active persona per horizon
);

create index if not exists future_selves_user_id_idx     on public.future_selves (user_id);
create index if not exists future_selves_horizon_idx     on public.future_selves (horizon);
create index if not exists future_selves_created_at_idx  on public.future_selves (created_at desc);

alter table public.future_selves enable row level security;

drop policy if exists future_selves_select on public.future_selves;
create policy future_selves_select on public.future_selves
  for select using (user_id = auth.uid());

drop policy if exists future_selves_insert on public.future_selves;
create policy future_selves_insert on public.future_selves
  for insert with check (user_id = auth.uid());

drop policy if exists future_selves_update on public.future_selves;
create policy future_selves_update on public.future_selves
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists future_selves_delete on public.future_selves;
create policy future_selves_delete on public.future_selves
  for delete using (user_id = auth.uid());

create table if not exists public.future_letters (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  future_self_id   uuid references public.future_selves(id) on delete set null,
  horizon          public.future_horizon not null,
  occasion         text not null,                       -- "birthday", "first hard week", "before the move"
  body             text not null,
  generated_at     timestamptz not null default now(),
  delivered_at     timestamptz,
  opened_at        timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists future_letters_user_id_idx       on public.future_letters (user_id);
create index if not exists future_letters_created_at_idx    on public.future_letters (created_at desc);
create index if not exists future_letters_horizon_idx       on public.future_letters (horizon);
create index if not exists future_letters_undelivered_idx
  on public.future_letters (user_id, generated_at)
  where delivered_at is null;
create index if not exists future_letters_unopened_idx
  on public.future_letters (user_id, delivered_at)
  where delivered_at is not null and opened_at is null;

alter table public.future_letters enable row level security;

drop policy if exists future_letters_select on public.future_letters;
create policy future_letters_select on public.future_letters
  for select using (user_id = auth.uid());

drop policy if exists future_letters_insert on public.future_letters;
create policy future_letters_insert on public.future_letters
  for insert with check (user_id = auth.uid());

drop policy if exists future_letters_update on public.future_letters;
create policy future_letters_update on public.future_letters
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists future_letters_delete on public.future_letters;
create policy future_letters_delete on public.future_letters
  for delete using (user_id = auth.uid());

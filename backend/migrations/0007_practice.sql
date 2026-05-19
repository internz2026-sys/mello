-- 0007_practice.sql
-- Practice: goals, habits, habit_observations
--
-- DELIBERATE: there is NO `streaks` table. mellō refuses streak-based shame
-- loops. We record observations (present / not present / note) but never
-- compute or display a consecutive-day counter. Patterns are surfaced as
-- gentle recurrence ("you've been showing up to this twice a week lately"),
-- not as numbers to defend.

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text not null,
  description   text,
  horizon       public.future_horizon,                   -- optional link to a future-self horizon
  active        boolean not null default true,
  paused_at     timestamptz,                             -- a "rest" state, not failure
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists goals_user_id_idx        on public.goals (user_id);
create index if not exists goals_created_at_idx     on public.goals (created_at desc);
create index if not exists goals_active_idx         on public.goals (user_id, active) where active = true;

alter table public.goals enable row level security;

drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select using (user_id = auth.uid());

drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert with check (user_id = auth.uid());

drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists goals_delete on public.goals;
create policy goals_delete on public.goals
  for delete using (user_id = auth.uid());

create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  goal_id       uuid references public.goals(id) on delete set null,
  title         text not null,
  cadence       text,                                    -- "daily", "weekly", free text
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists habits_user_id_idx     on public.habits (user_id);
create index if not exists habits_created_at_idx  on public.habits (created_at desc);
create index if not exists habits_goal_id_idx     on public.habits (goal_id);
create index if not exists habits_active_idx      on public.habits (user_id, active) where active = true;

alter table public.habits enable row level security;

drop policy if exists habits_select on public.habits;
create policy habits_select on public.habits
  for select using (user_id = auth.uid());

drop policy if exists habits_insert on public.habits;
create policy habits_insert on public.habits
  for insert with check (user_id = auth.uid());

drop policy if exists habits_update on public.habits;
create policy habits_update on public.habits
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists habits_delete on public.habits;
create policy habits_delete on public.habits
  for delete using (user_id = auth.uid());

-- Observations: one row per moment the user (or the system) notes whether the
-- habit was present. `present = false` is a neutral observation, not a failure.
create table if not exists public.habit_observations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  habit_id     uuid not null references public.habits(id) on delete cascade,
  observed_at  timestamptz not null default now(),
  present      boolean not null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists habit_observations_user_id_idx        on public.habit_observations (user_id);
create index if not exists habit_observations_habit_id_idx       on public.habit_observations (habit_id);
create index if not exists habit_observations_observed_at_idx    on public.habit_observations (observed_at desc);
create index if not exists habit_observations_habit_observed_idx on public.habit_observations (habit_id, observed_at desc);

alter table public.habit_observations enable row level security;

drop policy if exists habit_observations_select on public.habit_observations;
create policy habit_observations_select on public.habit_observations
  for select using (user_id = auth.uid());

drop policy if exists habit_observations_insert on public.habit_observations;
create policy habit_observations_insert on public.habit_observations
  for insert with check (user_id = auth.uid());

drop policy if exists habit_observations_update on public.habit_observations;
create policy habit_observations_update on public.habit_observations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists habit_observations_delete on public.habit_observations;
create policy habit_observations_delete on public.habit_observations
  for delete using (user_id = auth.uid());

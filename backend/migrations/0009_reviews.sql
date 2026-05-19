-- 0009_reviews.sql
-- reviews
--
-- Periodic distilled reflections written by mellō (weekly, monthly, seasonal,
-- yearly). Stored as plain text — the writing IS the artifact. The user can
-- read them; they are not used as RAG context (memories are).

create type public.review_period as enum ('weekly','monthly','seasonal','yearly');

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  period        public.review_period not null,
  period_start  date,
  period_end    date,
  body          text not null,
  generated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists reviews_user_id_idx       on public.reviews (user_id);
create index if not exists reviews_created_at_idx    on public.reviews (created_at desc);
create index if not exists reviews_period_idx        on public.reviews (period);
create index if not exists reviews_user_period_idx   on public.reviews (user_id, period, period_end desc);

alter table public.reviews enable row level security;

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select using (user_id = auth.uid());

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert with check (user_id = auth.uid());

drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete using (user_id = auth.uid());

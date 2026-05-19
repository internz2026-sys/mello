-- 0011_subscriptions.sql
-- subscriptions — Stripe mirror
--
-- This is a read-projection of Stripe. The Stripe webhook handler in the API
-- upserts rows here on customer.subscription.* events. The app reads from
-- this table for tier checks — never hits Stripe in the request path.
--
-- Tier names follow the product brief:
--   threshold  — entry tier
--   companion  — primary paid tier
--   sanctuary  — full tier (letters, deeper memory, longer retention)

create type public.subscription_tier as enum ('threshold','companion','sanctuary');

create type public.subscription_status as enum (
  'trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused'
);

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  tier                     public.subscription_tier not null,
  status                   public.subscription_status not null,
  period_end               timestamptz,
  cancel_at_period_end     boolean not null default false,
  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  stripe_price_id          text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- one current row per user is the common access pattern; we don't enforce
-- a hard unique here because historical/archived subscription rows may
-- coexist with an active one during plan changes.
create index if not exists subscriptions_user_id_idx               on public.subscriptions (user_id);
create index if not exists subscriptions_created_at_idx            on public.subscriptions (created_at desc);
create index if not exists subscriptions_user_status_idx           on public.subscriptions (user_id, status);
create index if not exists subscriptions_stripe_customer_idx       on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_active_idx
  on public.subscriptions (user_id) where status in ('trialing','active');

alter table public.subscriptions enable row level security;

-- Users can read their own subscription rows. Writes happen via the Stripe
-- webhook handler which runs under the service role and bypasses RLS.
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (user_id = auth.uid());

-- No client-side insert/update/delete: subscription state is owned by Stripe.

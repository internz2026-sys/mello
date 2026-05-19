-- 0012_safety_quarantine.sql
-- STEP 4B — crisis quarantine boundary + safety_events hardening.
--
-- Enforces docs/safety-boundary.md v0.2:
--   §9  quarantine by PHYSICS not policy — separate schema, separate role,
--       no read grant for the distiller/retriever/embedding/app accounts
--   §9  safety_events: structured flags only, NEVER raw user text
--   §11 default-deny: no principal reads safety_events/quarantine beyond
--       the append path until 4D explicitly grants reviewers
--   §6.5 cross-session proactive suppression state
--
-- Quarantine is NOT "another journal_entries kind". It is an isolated store
-- the memory engine has no credential path to. That separation is the
-- containment model; do not collapse it.

-- ---------------------------------------------------------------------------
-- 1. Quarantine schema + dedicated role (the credential boundary)
-- ---------------------------------------------------------------------------

create schema if not exists quarantine;

-- Dedicated role. ONLY the safety service connects as this role.
-- The general app role (used by reflection/distiller/retriever/embedding)
-- is never granted anything in this schema — see section 4.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mello_quarantine_rw') then
    create role mello_quarantine_rw nologin;
  end if;
end$$;

create table if not exists quarantine.crisis_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,                 -- intentionally NO FK to public.users:
                                                    -- quarantine must not be join-reachable from public schema
  detected_at        timestamptz not null default now(),
  -- Raw text lives ONLY here, under §10's restrictive retention default.
  -- It exists nowhere the distiller/retriever can reach.
  raw_text           text not null,
  -- The structured verdict that caused quarantine (no prose).
  risk               text not null,
  severity           text not null,
  resource_region    text,
  classifier_conf    numeric,
  -- Lifecycle: purged on the same delete-cascade as everything else
  -- (Blocker A2 / STEP 5). 4D may deliberately extend; default is short.
  purge_after        timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists quarantine_crisis_user_idx
  on quarantine.crisis_entries (user_id, detected_at desc);

-- The safety role may read/write quarantine. Nobody else gets a grant.
grant usage on schema quarantine to mello_quarantine_rw;
grant select, insert, delete on quarantine.crisis_entries to mello_quarantine_rw;

-- ---------------------------------------------------------------------------
-- 2. safety_events hardening — structured flags only, default-deny
-- ---------------------------------------------------------------------------
-- 0010 created public.safety_events with a user-readable SELECT policy.
-- v0.2 §11 is default-deny: no reviewer until 4D names one. Drop the
-- user-facing select policy. Append path remains (service-role context).

drop policy if exists safety_events_select on public.safety_events;

-- Reassert: safety_events carries NO raw user text. 0010's columns are all
-- structured (signal_type, response_taken, resources_shown, severity, ...).
-- A guard so a future migration cannot quietly add a free-text body column
-- without tripping review:
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'safety_events'
      and column_name in ('body', 'raw_text', 'content', 'entry_text')
  ) then
    raise exception
      'safety_events must not carry raw user text (safety-boundary.md v0.2 §9). '
      'Raw text belongs only in quarantine.crisis_entries.';
  end if;
end$$;

comment on table public.safety_events is
  'Structured crisis-event flags only. NEVER raw user text (raw text lives '
  'only in quarantine.crisis_entries). Default-deny reads until 4D names '
  'reviewers. See docs/safety-boundary.md v0.2 §9/§11.';

-- ---------------------------------------------------------------------------
-- 3. Cross-session proactive suppression state (§6.5)
-- ---------------------------------------------------------------------------
-- A time-boxed, non-semantic pause. NOT a crisis-risk label on the user.
-- While set, the scheduler sends no proactive contact of any kind.
alter table public.profiles
  add column if not exists proactive_engagement_paused_until timestamptz;

comment on column public.profiles.proactive_engagement_paused_until is
  'When set and in the future: NO proactive contact (morning/evening prompts, '
  'Future Self letters, relationship nudges, values reminders). Time-boxed, '
  'non-semantic, carries no risk classification. See safety-boundary.md §6.5.';

-- ---------------------------------------------------------------------------
-- 4. Containment assertions (physics, not policy)
-- ---------------------------------------------------------------------------
-- The general application role MUST NOT be able to read quarantine. This
-- migration deliberately issues NO grant of the quarantine schema to any
-- app/distiller/retriever/embedding role. Deployment MUST connect the
-- safety service with role mello_quarantine_rw and everything else with a
-- role that has no quarantine grant. The §12 leakage test verifies this.
--
-- If you are reading this during a refactor and are tempted to grant the
-- app role access to quarantine "just for convenience": that is the exact
-- failure docs/safety-boundary.md §9 exists to prevent. Do not.
revoke all on schema quarantine from public;
revoke all on all tables in schema quarantine from public;

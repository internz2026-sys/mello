-- 0010_safety_events.sql
-- safety_events  (HIGH PRIORITY)
--
-- Anything that triggers a safety response — self-harm signals, crisis
-- language, intoxication risk, abuse disclosure. Every event is logged with:
--   - what signal fired
--   - what response mellō took (resource shown, conversation paused, hand-off)
--   - whether a human was looped in
--
-- This table is critical for product accountability and for retrospectively
-- auditing the safety pipeline. It is also the most sensitive table in the
-- database: RLS still restricts to the owning user, but the API surface that
-- writes here must come from a service-role context (no client-side writes
-- in production).

create table if not exists public.safety_events (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  detected_at           timestamptz not null default now(),
  signal_type           text not null,                    -- "self_harm", "crisis", "substance", "abuse", "other"
  source                text,                             -- "journal_entry" | "chat_message" | "manual"
  source_id             uuid,                             -- id of the triggering record (no FK; cross-table)
  severity              text check (severity in ('low','medium','high','critical')),
  response_taken        text not null,                    -- human-readable description
  resources_shown       text[],                           -- ["988","crisis_text_line", ...]
  escalated_to_human    boolean not null default false,
  escalation_notes      text,
  acknowledged_by_user  boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists safety_events_user_id_idx           on public.safety_events (user_id);
create index if not exists safety_events_detected_at_idx       on public.safety_events (detected_at desc);
create index if not exists safety_events_user_detected_idx     on public.safety_events (user_id, detected_at desc);
create index if not exists safety_events_signal_type_idx       on public.safety_events (signal_type);
create index if not exists safety_events_escalated_idx
  on public.safety_events (escalated_to_human, detected_at desc) where escalated_to_human = true;

alter table public.safety_events enable row level security;

-- The user can see their own safety events (e.g. to review what mellō flagged
-- and how it responded). Writes are typically performed by the service role,
-- which bypasses RLS; we still publish a self-insert policy for completeness.
drop policy if exists safety_events_select on public.safety_events;
create policy safety_events_select on public.safety_events
  for select using (user_id = auth.uid());

drop policy if exists safety_events_insert on public.safety_events;
create policy safety_events_insert on public.safety_events
  for insert with check (user_id = auth.uid());

-- Note: no update/delete policy for end users. Safety events are append-only
-- from the user's perspective. Audit edits flow through the service role.

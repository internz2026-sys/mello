-- 0014_proactive_suppression_role.sql
-- STEP 4B.6 — least-privilege credential for cross-session proactive
-- suppression (safety-boundary.md v0.2 §6.5).
--
-- The suppression service may ONLY read and set the single column
-- profiles.proactive_engagement_paused_until. It cannot read or write any
-- other profile attribute, any journal/chat/memory, or any safety table.
-- Fourth isolated boundary: app | quarantine_rw | safety_events_append |
-- suppression_rw.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mello_suppression_rw') then
    create role mello_suppression_rw nologin;
  end if;
end$$;

grant usage on schema public to mello_suppression_rw;

-- Column-scoped privileges only. No table-wide select/update; no other
-- column. The suppression flag is non-semantic and carries no risk label
-- (it is "do not initiate contact until X", not "this user is a risk").
grant select (id, proactive_engagement_paused_until) on public.profiles
  to mello_suppression_rw;
grant update (proactive_engagement_paused_until) on public.profiles
  to mello_suppression_rw;

comment on column public.profiles.proactive_engagement_paused_until is
  'When set and in the future: NO proactive contact (morning/evening '
  'prompts, Future Self letters, relationship nudges, values reminders). '
  'Time-boxed, non-semantic, no risk classification. Written only by the '
  'mello_suppression_rw column-scoped role. A later crisis EXTENDS the '
  'pause, never shortens it. See safety-boundary.md v0.2 §6.5.';

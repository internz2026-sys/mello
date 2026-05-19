-- 0013_safety_events_append_role.sql
-- STEP 4B.5 — default-deny enforced by credential, not convention.
--
-- safety-boundary.md v0.2 §9/§11: safety_events is structured flags only,
-- and NO principal may read it until 4D names reviewers. We enforce that in
-- physics: a dedicated role whose ONLY capability is INSERT on
-- public.safety_events — no SELECT, no UPDATE, no DELETE, no other table.
-- The safety-events append service connects as this role and nothing else.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mello_safety_events_append') then
    create role mello_safety_events_append nologin;
  end if;
end$$;

-- Append-only. Deliberately NO select/update/delete grant — this role
-- structurally cannot read or mutate safety_events. Reviewer read access,
-- if ever granted, is a separate 4D decision under a different role.
grant usage on schema public to mello_safety_events_append;
grant insert on public.safety_events to mello_safety_events_append;

revoke select, update, delete on public.safety_events from mello_safety_events_append;

comment on table public.safety_events is
  'Structured crisis-event flags only; NEVER raw user text (raw text lives '
  'only in quarantine.crisis_entries). Writes via the INSERT-only role '
  'mello_safety_events_append. Default-deny reads until 4D names a '
  'reviewer role. See docs/safety-boundary.md v0.2 §9/§11.';

-- Containment note: do not grant this role anything beyond INSERT on
-- safety_events, and do not let the safety-events service reuse the main
-- app or quarantine connection. Three isolated credentials, three
-- boundaries: app | quarantine_rw | safety_events_append.

-- 0001_extensions.sql
-- mellō — Phase 1 schema
-- Required Postgres extensions.
--
-- pgcrypto      : gen_random_uuid()
-- citext        : case-insensitive text (email)
-- pg_trgm       : trigram indexes for fuzzy text search on names/themes
--
-- Supabase already ships with these but we declare explicitly so a vanilla
-- Postgres 16 instance (e.g. local docker) bootstraps the same way.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- The auth.uid() helper is provided by Supabase. For local psql smoke
-- testing where the `auth` schema does not exist, we shim a stub so RLS
-- policies parse and tables can be created. Supabase's real auth.uid()
-- always wins because `create schema if not exists` is a no-op there.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    create schema auth;
    create or replace function auth.uid() returns uuid
      language sql stable
    as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
  end if;
end $$;

# mellō — Postgres / Supabase migrations

This directory holds the numbered SQL migrations for mellō's Postgres schema
(hosted on Supabase in production). Files are applied **in lexicographic
filename order**, which is also the dependency order.

## Apply order

| # | File | What it adds |
|---|---|---|
| 0001 | `0001_extensions.sql` | `pgcrypto`, `citext`, `pg_trgm`; `auth.uid()` shim for local psql |
| 0002 | `0002_identity.sql` | `users`, `profiles` (spiritual opt-in, notification window, retention) |
| 0003 | `0003_reflection_profiles.sql` | versioned interior-landscape snapshots |
| 0004 | `0004_episodic.sql` | `journal_entries`, `chat_messages` |
| 0005 | `0005_memories.sql` | semantic memory store (mirrors `voice/memory-taxonomy.md`) |
| 0006 | `0006_future_self.sql` | `future_selves`, `future_letters` |
| 0007 | `0007_practice.sql` | `goals`, `habits`, `habit_observations` — **no streaks** |
| 0008 | `0008_people.sql` | named relationships with importance + last-touched |
| 0009 | `0009_reviews.sql` | weekly/monthly/seasonal/yearly distilled reviews |
| 0010 | `0010_safety_events.sql` | crisis / self-harm signal log + response audit trail |
| 0011 | `0011_subscriptions.sql` | Stripe mirror (threshold / companion / sanctuary) |

Migrations are idempotent (`create ... if not exists`, `drop policy if exists`
before `create policy`) so re-running on a partially-applied database is safe.

## How to run

### Option A — Supabase CLI (production / staging)

The Supabase CLI picks up everything in `supabase/migrations/` by default.
Either copy these files into that directory, or point a custom migration
runner at this folder. The simplest flow:

```bash
# from repo root
supabase db push --file backend/migrations/0001_extensions.sql
supabase db push --file backend/migrations/0002_identity.sql
# ... etc, in order
```

Or, if you symlink/copy into `supabase/migrations/`:

```bash
supabase db push
```

### Option B — plain psql (local dev, smoke tests)

Set `DATABASE_URL` to a running Postgres 16 instance, then:

```bash
./apply.sh
```

`apply.sh` runs every `*.sql` file in this directory in sorted order, halting
on the first error (`psql -v ON_ERROR_STOP=1 --single-transaction`).

### Option C — local docker smoke test

```bash
docker run --rm -d --name mello-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
./apply.sh
docker stop mello-pg
```

## RLS posture

Every user-owned table has Row Level Security **enabled** with policies that
restrict all access to `user_id = auth.uid()`. Specifically:

- `SELECT / UPDATE / DELETE` use `USING (user_id = auth.uid())`
- `INSERT` uses `WITH CHECK (user_id = auth.uid())`
- `safety_events` is **append-only** from the user's perspective (no update/delete policy).
- `subscriptions` is **read-only** to the user (writes flow from the Stripe
  webhook handler under the service role).

The Supabase service role bypasses RLS, which is the intended channel for
the API, the distiller, the retriever, and webhook handlers.

## Notable design decisions

- **No `streaks` table.** Deliberate. mellō refuses streak-based shame loops.
  Recurrence is observed via `habit_observations` and surfaced as gentle
  language, never as a counter to defend.
- **Sealed memories are easy to filter.** `memories.sensitivity` is indexed
  directly, and a partial index `memories_user_unsealed_idx` plus the view
  `memories_retrievable` give the Retriever a cheap default of "exclude sealed".
- **`spiritual_themes` is nullable.** Many users will not opt in; the column
  is `text[]` with NULL allowed rather than `default '{}'` so absence is
  semantically distinct from "opted in but no themes yet".
- **Enums mirror `voice/memory-taxonomy.md` exactly** — kind, stability,
  sensitivity. Changing them is a versioned event; existing rows keep their
  old vocab via `memories.vocab_version`.
- **No LangChain dependency surface.** Schema is plain SQL; the API and
  distiller talk to Postgres directly through Supabase / a Postgres driver.

## Rolling back

There are no down-migrations on purpose. In Phase 0/1 we treat the database
as ephemeral — for destructive changes during development, drop the schema
(`drop schema public cascade; create schema public;`) and re-apply. Once
real user data exists, every change is forward-only with a paired data
migration.

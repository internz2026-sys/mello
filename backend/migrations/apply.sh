#!/usr/bin/env bash
# apply.sh — run every *.sql in this directory, in lexicographic order, via psql.
#
# Requires:
#   - psql on PATH
#   - DATABASE_URL set, OR PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
#
# Usage:
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres ./apply.sh
#
# Behaviour:
#   - Each file is applied with --single-transaction -v ON_ERROR_STOP=1.
#     If any statement in a file errors, that file rolls back and the script
#     exits non-zero. Already-applied files are NOT rolled back.
#   - The schema is idempotent ("create ... if not exists", "drop policy if exists")
#     so re-running on a partial database is safe.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v psql >/dev/null 2>&1; then
  echo "error: psql not found on PATH" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" && -z "${PGHOST:-}" ]]; then
  echo "error: set DATABASE_URL (or PGHOST/PGUSER/PGDATABASE) before running" >&2
  exit 1
fi

shopt -s nullglob
files=("$here"/[0-9]*.sql)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "no migration files found in $here" >&2
  exit 1
fi

IFS=$'\n' sorted=($(printf "%s\n" "${files[@]}" | sort))
unset IFS

for f in "${sorted[@]}"; do
  echo "==> applying $(basename "$f")"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    psql "$DATABASE_URL" \
      --single-transaction \
      -v ON_ERROR_STOP=1 \
      -f "$f"
  else
    psql \
      --single-transaction \
      -v ON_ERROR_STOP=1 \
      -f "$f"
  fi
done

echo "==> all migrations applied"

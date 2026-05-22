#!/bin/bash
# LOCAL Postgres init — applies backend/migrations/*.sql in order, inside
# the postgres container (psql is present there; not on the host).
# Runs ONCE on first init (empty data dir), as the postgres superuser,
# BEFORE 01-local-logins.sql (alphabetical initdb ordering). Creating the
# schema + the three NOLOGIN privilege roles must precede granting them
# to the local login users.
set -euo pipefail

echo "[init] applying migrations from /migrations ..."
for f in $(ls /migrations/*.sql | sort); do
  echo "[init] -> $f"
  psql -v ON_ERROR_STOP=1 \
       --username "$POSTGRES_USER" \
       --dbname "$POSTGRES_DB" \
       -f "$f"
done
echo "[init] migrations applied."

#!/usr/bin/env sh
# mellō — deploy-time safety smoke gate (STEP 5-3 / S5-3d)
#
# Runs the S5-2 deploy-smoke suite. Block A (deployment-invariant safety
# re-assertions) always runs. Block B (live HTTP checks: public
# registration unreachable, protected route not bypassable) runs only
# when ALPHA_BASE_URL is given.
#
#   ./scripts/deploy-smoke.sh https://alpha.example.com
#   ./scripts/deploy-smoke.sh            # Block A only (no live target)
#
# NON-ZERO EXIT = FAILED DEPLOY. The deploy procedure MUST treat this as
# a hard stop — never "deploy anyway". This runs from the repo (host/CI),
# not inside the shipped image.
set -eu

REPO_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$REPO_DIR/api"

if [ "${1:-}" != "" ]; then
  ALPHA_BASE_URL="$1"
  export ALPHA_BASE_URL
  echo "[deploy-smoke] Block A + Block B against: $ALPHA_BASE_URL"
else
  echo "[deploy-smoke] Block A only (no ALPHA_BASE_URL given)"
fi

# Only the deploy-smoke suite; -i matches the spec file by path token.
npx jest deploy-smoke --silent
rc=$?

if [ "$rc" -ne 0 ]; then
  echo "[deploy-smoke] FAILED (exit $rc) — DO NOT DEPLOY." >&2
  exit "$rc"
fi
echo "[deploy-smoke] PASS — safety invariants hold in this environment."

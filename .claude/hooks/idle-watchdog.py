#!/usr/bin/env python
"""Stop hook — non-blocking idle detector for the mellō knowledgebase.

Runs instantly on every Stop (no sleep). It records the timestamp of each
Stop and compares against the previous one. If the gap since the last turn
exceeded the idle threshold — i.e. the user stepped away and has now come
back — it nudges (once) to flush the knowledgebase before continuing.

This replaces the earlier 5-minute `time.sleep` design, which relied on an
unsupported "asyncRewake" notion: Stop hooks are synchronous, so a long
sleep would either hit the timeout or add latency after every response.

Mechanism: exit code 2 returns the stderr text to Claude as a reminder.
The `stop_hook_active` flag (provided on stdin) guards against re-firing
during the resulting continuation, so there is no loop.
"""
import datetime
import json
import os
import sys

PROJECT_ROOT = r"C:\Users\Admin\Documents\mello"
STATE_FILE = os.path.join(PROJECT_ROOT, ".mello-last-stop")
IDLE_SECONDS = 300  # 5 minutes

try:
    data = json.load(sys.stdin) if not sys.stdin.isatty() else {}
except Exception:
    data = {}

stop_hook_active = bool(data.get("stop_hook_active", False))

now = datetime.datetime.now()
now_ts = now.timestamp()

# Previous stop timestamp (None on first stop of a fresh checkout/session).
prev_ts = None
try:
    with open(STATE_FILE, encoding="utf-8") as f:
        prev_ts = float(f.read().strip())
except Exception:
    prev_ts = None

# Always record this stop for the next comparison.
try:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        f.write(str(now_ts))
except Exception:
    pass  # never block stop on disk errors

# If we are already inside a stop-hook-triggered continuation, do not re-fire.
if stop_hook_active:
    sys.exit(0)

# Nudge once if the user was idle longer than the threshold between turns.
if prev_ts is not None and (now_ts - prev_ts) > IDLE_SECONDS:
    idle_min = int((now_ts - prev_ts) // 60)
    sys.stderr.write(
        f"[mello] ~{idle_min} min elapsed since the last turn. If meaningful "
        "progress was made, consider flushing the knowledgebase "
        "(docs/SESSION-STATE.md and/or project_mello.md) before continuing."
    )
    sys.exit(2)

sys.exit(0)

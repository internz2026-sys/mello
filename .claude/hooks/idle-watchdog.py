#!/usr/bin/env python
"""Stop hook with asyncRewake — fires when Claude finishes a response.

Sleeps 5 minutes in the background. If still alive at the end (the user hasn't
sent another turn — which would have killed this background hook), drops an
idle marker and exits with code 2 to wake the model with a reminder to flush
the knowledgebase.

This is the closest available approximation of "user idle for 5 minutes" given
Claude Code's hook surface. There is no native idle-detection event.
"""
import datetime
import json
import os
import sys
import time

PROJECT_ROOT = r"C:\Users\Admin\Documents\mello"
IDLE_MARKER = os.path.join(PROJECT_ROOT, ".mello-idle-marker")
IDLE_SECONDS = 300  # 5 minutes

# Read session_id from stdin if available
try:
    data = json.load(sys.stdin) if not sys.stdin.isatty() else {}
except Exception:
    data = {}
session_id = data.get("session_id", "unknown")

# Sleep — if the user submits a new turn, the harness kills this process
time.sleep(IDLE_SECONDS)

# We survived the sleep, so the user has been idle for 5+ minutes
ts = datetime.datetime.now().isoformat(timespec="seconds")
try:
    with open(IDLE_MARKER, "w", encoding="utf-8") as f:
        f.write(f"session_id={session_id} idle_since={ts}\n")
except Exception:
    pass

# Output a wake-up message and exit code 2 (asyncRewake trigger)
msg = (
    "5 minutes of user idle detected. Consider updating the mellō knowledgebase "
    "now (project_mello.md and/or in-repo docs) so progress persists if the "
    "session ends abruptly."
)
sys.stdout.write(msg)
sys.exit(2)

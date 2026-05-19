#!/usr/bin/env python
"""SessionEnd hook for mello project.

Drops a marker so the next SessionStart triggers a memory-update review.
"""
import datetime
import json
import os
import sys

PROJECT_ROOT = r"C:\Users\Admin\Documents\mello"
MARKER = os.path.join(PROJECT_ROOT, ".mello-pending-memory-update")

try:
    data = json.load(sys.stdin) if not sys.stdin.isatty() else {}
except Exception:
    data = {}

session_id = data.get("session_id", "unknown")
ts = datetime.datetime.now().isoformat(timespec="seconds")

try:
    with open(MARKER, "w", encoding="utf-8") as f:
        f.write(f"session_id={session_id} ended_at={ts}\n")
except Exception:
    pass  # never block session-end on disk errors

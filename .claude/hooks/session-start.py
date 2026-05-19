#!/usr/bin/env python
"""SessionStart hook for mello project.

Injects a reminder for the assistant to:
1. Begin its first response with "I am Mello agent."
2. Check for a pending memory update marker from prior session.
"""
import json
import os
import sys

PROJECT_ROOT = r"C:\Users\Admin\Documents\mello"
MARKER = os.path.join(PROJECT_ROOT, ".mello-pending-memory-update")
IDLE_MARKER = os.path.join(PROJECT_ROOT, ".mello-idle-marker")
MEMORY_DIR = r"C:\Users\Admin\.claude\projects\c--Users-Admin\memory"
PROJECT_MEMORY = os.path.join(MEMORY_DIR, "project_mello.md")

GREETING = (
    "You are working on the mellō project. "
    'Begin your first response with the literal phrase: "I am Mello agent." '
    f"Project context lives at {PROJECT_MEMORY} and in this repo's voice/ and CLAUDE.md."
)


def consume_marker(path: str) -> str | None:
    """Read a marker file and delete it. Returns its content or None."""
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read().strip()
        os.remove(path)
        return content
    except Exception:
        return None


prev_session = consume_marker(MARKER)
idle_event = consume_marker(IDLE_MARKER)

context = GREETING
notes: list[str] = []

if prev_session:
    notes.append(
        f"A previous mellō session ended without a memory review. "
        f"Marker: {prev_session}"
    )
if idle_event:
    notes.append(
        f"The previous session went idle for 5+ minutes. "
        f"Marker: {idle_event}"
    )

if notes:
    context += (
        "\n\nBefore continuing the user's new request, briefly:\n"
        "1. Skim recent work in voice/, distiller/, audits/ "
        "(use Bash 'git log -5 --stat' for a quick overview).\n"
        f"2. Update {PROJECT_MEMORY} with any significant new decisions, progress, "
        "or insights from prior sessions that should persist.\n"
        "3. Then proceed with the user's actual request.\n\n"
        "Pending notes: " + " | ".join(notes)
    )

output = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": context,
    }
}
json.dump(output, sys.stdout)

"""mellō — Memory Distiller (Phase 0 prototype)

Two-pass Claude pipeline:
  1. Noticer  — reads a window of journal entries, extracts raw observations
                (emotions, themes, named people, values, fears, hopes).
  2. Distiller — looks at the observations + existing semantic memories
                 and decides what (if anything) belongs in long-term memory.

Routes ALL Claude calls through the Claude Code CLI (`claude -p`), not the
Anthropic API. This uses the user's existing Claude Code authentication;
no ANTHROPIC_API_KEY is required.

This is a CLI prototype. No database, no Qdrant, no API. Reads from a JSON
file of journal entries, writes a JSON file of distilled memories.

The single most important thing: if reading the output gives you a chill
("this is exactly what I was working through"), the architecture works.
If it produces generic summaries, the prompt or the model is wrong.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Model aliases as accepted by the Claude Code CLI's --model flag.
# 'sonnet' / 'opus' resolve to the latest version of each.
CLAUDE_MODEL_NOTICER = os.environ.get("MELLO_NOTICER_MODEL", "sonnet")
CLAUDE_MODEL_DISTILLER = os.environ.get("MELLO_DISTILLER_MODEL", "opus")

# Path to the claude CLI binary. Override via CLAUDE_CLI env for non-standard installs.
CLAUDE_CLI = os.environ.get("CLAUDE_CLI") or shutil.which("claude") or "claude"


@dataclass
class JournalEntry:
    id: str
    user_id: str
    created_at: str
    kind: str
    content: str

    @classmethod
    def from_dict(cls, d: dict) -> "JournalEntry":
        return cls(**d)


@dataclass
class Observation:
    source_entry_id: str
    summary: str
    emotions: list[str] = field(default_factory=list)
    themes: list[str] = field(default_factory=list)
    relationships: list[str] = field(default_factory=list)
    values: list[str] = field(default_factory=list)
    fears: list[str] = field(default_factory=list)
    hopes: list[str] = field(default_factory=list)


@dataclass
class Memory:
    kind: str
    stability: str
    sensitivity: str
    summary: str
    evidence: list[str]
    emotions: list[str]
    themes: list[str]
    relationships: list[str]
    spiritual_themes: list[str]
    importance: float
    identity_weight: float
    first_observed_at: str
    last_reinforced_at: str


NOTICER_SYSTEM = """You are the 'Noticer' for mellō, a reflective companion app.

Read a window of one user's journal entries and produce a clean list of
factual observations. You do NOT interpret, diagnose, or moralize. You name
what the entries actually contain.

For each entry, extract:
- summary: a one-line factual statement of what the entry is about
- emotions: explicitly expressed or strongly implied (controlled vocab below, max 3)
- themes: topics the entry touches (controlled vocab below, max 4)
- relationships: names of people mentioned, as the user labeled them
- values: values named or revealed by what they care about
- fears: fears or worries named
- hopes: hopes or aspirations named

EMOTION VOCABULARY (choose only from these, max 3):
grief, loneliness, shame, fear, dread, despair, regret, anger, bitterness, numbness,
tiredness, sadness, disappointment, worry, longing, tenderness, vulnerability, nostalgia,
restlessness, confusion, frustration, boredom, ambivalence,
gratitude, joy, peace, wonder, affection, contentment, relief, awe,
curiosity, determination, delight

THEME VOCABULARY (choose only from these, max 4):
work, career-direction, burnout, ambition, failure, success, craft, meaning-of-work, calling,
money, financial-fear, stewardship, generosity, simplicity, consumption,
sleep, exercise, body, food, illness, aging, rest,
anxiety, depression, attention, overthinking, mental-load,
marriage, parenting, friendship, family, loneliness-of-presence, conflict, forgiveness, boundaries, intimacy,
identity, self-image, confidence, comparison, perfectionism, self-compassion, doubt, faith,
time, rhythm, urgency, slowness, seasons, silence,
change, habit, formation, relapse, return, practice, resistance,
past, future, regret, legacy, mortality

HARD CONSTRAINT — the controlled vocabularies are part of the architecture,
not suggestions. Every emotion and theme MUST be an exact string from the
lists above. Never invent, paraphrase, merge, hyphenate, or infer a new
label. If nothing fits cleanly, choose the closest existing term — do not
generate a new one. A made-up tag is a failure, not a nuance.

Return ONLY valid JSON: a list of observation objects, one per entry, in input order."""


NOTICER_USER_TEMPLATE = """User's journal entries (most recent first):

{entries_block}

Return JSON list of observations, one per entry:
[
  {{
    "source_entry_id": "...",
    "summary": "...",
    "emotions": [...],
    "themes": [...],
    "relationships": [...],
    "values": [...],
    "fears": [...],
    "hopes": [...]
  }}
]"""


DISTILLER_SYSTEM = """You are the 'Distiller' for mellō — the part of the system that
decides what crosses from the user's daily journal into long-term semantic memory.

You are extraordinarily conservative. MOST DAYS PRODUCE NO NEW MEMORIES. The user
journaling about a difficult meeting is not a memory. The user revealing a
recurring pattern of avoiding hard conversations IS a memory.

A semantic memory is something that would still matter to know about this user
in 6 months. It is identity-shaping, not weather.

RECURRENCE CAN BE STATED, NOT ONLY OBSERVED. Recurrence does not require the
same theme to appear across multiple journal entries. When the user names the
repetition inside a single entry — "I always do this", "again", "every time
I'm stressed", "third time this month", "I said I'd stop and didn't" — that
IS recurrence, and it is high signal. Self-recognized repetition means the
user has crossed from event to pattern-awareness; that crossing is
identity-relevant.

This does NOT lower the bar and does NOT mean produce more memories. Ordinary
moods, transient frustrations, one-off complaints, and decorative journaling
still produce nothing. The rule is narrow: do not miss an obviously
identity-relevant pattern merely because the user confessed it in one entry
instead of repeating it across several.

You are given:
- A list of recent observations (from the Noticer pass)
- A list of existing semantic memories for this user

Produce a list of MemoryAction objects. Each is one of:
1. "new" — create a new semantic memory
2. "reinforce" — an existing memory is reinforced (recurrence++, importance bumps)
3. "contradict" — an existing memory appears to be evolving past; flag it

Most of the time, the right output is an empty list. Trust silence.

RULES:
- Memory summaries are 1–3 sentences, plain prose, never lists.
- Do not interpret motives the user did not state.
- Do not diagnose. Describe behavior, not labels.
- Cite evidence (source_entry_id) for every new memory — at least 2 unless it's a stable identity fact.
- Be conservative with sensitivity. If it touches trauma, shame, or vulnerability, default to 'tender'.
  If it's a confession the user would not want surfaced casually, default to 'sealed'.
- identity_weight reflects how core this is to who the user is.
- Memory kinds: identity, pattern, value, relationship, fear, hope, wound, gladness, commitment
  A memory has exactly ONE kind. Precedence when multiple could apply: wound > pattern > fear > commitment > value > relationship > hope > gladness > identity.
- Memory stability: stable, evolving, volatile

THEME VOCABULARY (themes[] MUST come from this exact list):
work, career-direction, burnout, ambition, failure, success, craft, meaning-of-work, calling,
money, financial-fear, stewardship, generosity, simplicity, consumption,
sleep, exercise, body, food, illness, aging, rest,
anxiety, depression, attention, overthinking, mental-load,
marriage, parenting, friendship, family, loneliness-of-presence, conflict, forgiveness, boundaries, intimacy,
identity, self-image, confidence, comparison, perfectionism, self-compassion, doubt, faith,
time, rhythm, urgency, slowness, seasons, silence,
change, habit, formation, relapse, return, practice, resistance,
past, future, regret, legacy, mortality

HARD CONSTRAINT — themes MUST exactly match one or more entries from the
vocabulary above. Never invent, paraphrase, merge, or infer new theme names.
If no theme fits cleanly, choose the closest existing theme rather than
generating a new one. (A prior run invented "intentional-living" — that is
exactly the failure this constraint exists to prevent.)

SPIRITUAL THEMES VOCABULARY (populate spiritual_themes[] when relevant):
trust, surrender, humility, lament, repentance, grace, discipleship, vocation, stewardship,
obedience, presence, service, community, discernment, worship, prayer, scripture, church, sabbath
Only populate spiritual_themes[] when the entry has spiritual content AND the user has opted in
(this is checked downstream — for now, populate if relevant).

Return ONLY valid JSON: a list of MemoryAction objects."""


DISTILLER_USER_TEMPLATE = """## Recent observations

{observations_json}

## Existing memories (semantic store, for context)

{existing_memories_json}

## Your task

Decide what (if anything) should change in long-term memory. Most days, the
answer is nothing. When you do propose a new memory, it should be the kind
of thing that, if read back to the user, they would say "yes — that's
true about me."

Return JSON:
[
  {{
    "action": "new" | "reinforce" | "contradict",
    "memory": {{
      "kind": "...",
      "stability": "stable" | "evolving" | "volatile",
      "sensitivity": "normal" | "tender" | "sealed",
      "summary": "...",
      "evidence": ["entry_id", ...],
      "emotions": [...],
      "themes": [...],
      "relationships": [...],
      "spiritual_themes": [...],
      "importance": 0.0-1.0,
      "identity_weight": 0.0-1.0
    }},
    "reinforce_id": "..." (only for reinforce/contradict),
    "reasoning": "one short sentence on why this matters"
  }}
]

If nothing crosses the threshold, return []."""


def claude_json(model: str, system: str, user: str) -> Any:
    """Call Claude via the Claude Code CLI and parse JSON from the response."""
    proc = subprocess.run(
        [
            CLAUDE_CLI,
            "-p", user,
            "--system-prompt", system,
            "--model", model,
            "--output-format", "json",
            "--disable-slash-commands",     # prevent skill drift in the sub-claude
            "--no-session-persistence",     # don't save the sub-session to disk
            "--permission-mode", "bypassPermissions",  # pure text completion; no tools used
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        # Empty stdin so the CLI doesn't try to read from a parent terminal
        stdin=subprocess.DEVNULL,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"claude CLI failed (exit {proc.returncode}): "
            f"{(proc.stderr or proc.stdout)[:500]}"
        )
    try:
        envelope = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"claude CLI returned non-JSON output: {proc.stdout[:500]}"
        ) from e
    if envelope.get("is_error"):
        raise RuntimeError(f"claude CLI returned an error envelope: {envelope}")
    text = (envelope.get("result") or "").strip()
    # Some responses wrap JSON in ```json fences — strip if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return json.loads(text)


def run_noticer(entries: list[JournalEntry]) -> list[Observation]:
    entries_block = "\n\n".join(
        f"--- entry_id: {e.id} | {e.created_at} | kind: {e.kind} ---\n{e.content}"
        for e in entries
    )
    raw = claude_json(
        CLAUDE_MODEL_NOTICER,
        NOTICER_SYSTEM,
        NOTICER_USER_TEMPLATE.format(entries_block=entries_block),
    )
    return [Observation(**obs) for obs in raw]


def run_distiller(
    observations: list[Observation],
    existing_memories: list[Memory],
) -> list[dict]:
    obs_json = json.dumps([asdict(o) for o in observations], indent=2, ensure_ascii=False)
    mem_json = json.dumps([asdict(m) for m in existing_memories], indent=2, ensure_ascii=False)
    return claude_json(
        CLAUDE_MODEL_DISTILLER,
        DISTILLER_SYSTEM,
        DISTILLER_USER_TEMPLATE.format(
            observations_json=obs_json,
            existing_memories_json=mem_json or "[]",
        ),
    )


def apply_actions(actions: list[dict], existing: list[Memory]) -> list[Memory]:
    """Naive reconciliation — appends new memories. Production would merge by id."""
    now = datetime.now(timezone.utc).isoformat()
    out = list(existing)
    for a in actions:
        if a.get("action") == "new":
            m = a["memory"]
            m.setdefault("first_observed_at", now)
            m.setdefault("last_reinforced_at", now)
            m.setdefault("spiritual_themes", [])
            out.append(Memory(**m))
    return out


def main() -> None:
    p = argparse.ArgumentParser(description="mellō memory distiller")
    p.add_argument("--in", dest="in_path", required=True, help="JSON file of journal entries")
    p.add_argument("--out", dest="out_path", required=True, help="JSON file for memories output")
    p.add_argument("--existing", dest="existing_path", help="Optional existing memories JSON")
    args = p.parse_args()

    if not shutil.which(CLAUDE_CLI):
        sys.exit(
            f"Claude CLI not found at '{CLAUDE_CLI}'. "
            "Install Claude Code or set CLAUDE_CLI env var to its path."
        )

    in_data = json.loads(Path(args.in_path).read_text(encoding="utf-8"))
    entries = [JournalEntry.from_dict(e) for e in in_data]

    existing: list[Memory] = []
    if args.existing_path and Path(args.existing_path).exists():
        existing = [Memory(**m) for m in json.loads(Path(args.existing_path).read_text(encoding="utf-8"))]

    print(f"[noticer] reading {len(entries)} entries via Claude CLI ({CLAUDE_MODEL_NOTICER})...", file=sys.stderr)
    observations = run_noticer(entries)
    print(f"[noticer] produced {len(observations)} observations", file=sys.stderr)

    print(f"[distiller] reviewing against {len(existing)} existing memories via Claude CLI ({CLAUDE_MODEL_DISTILLER})...", file=sys.stderr)
    actions = run_distiller(observations, existing)
    new_count = sum(1 for a in actions if a.get("action") == "new")
    print(f"[distiller] proposed {len(actions)} actions ({new_count} new)", file=sys.stderr)

    if not actions:
        print("[distiller] no new memories today. trust silence.", file=sys.stderr)

    updated = apply_actions(actions, existing)

    out_path = Path(args.out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps([asdict(m) for m in updated], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"[done] wrote {len(updated)} memories to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()

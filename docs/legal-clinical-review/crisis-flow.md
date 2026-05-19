# Crisis Data-Flow — Where Crisis Text Goes, and Where It Provably Never Goes

This is the document a privacy/security reviewer should read most closely.
It describes data movement in plain terms. The architectural claims here
are enforced by automated tests (see `classifier-baseline-summary.md`),
not by convention.

## The flow

```
                       ┌─────────────────────────────┐
   User writes an  ───▶ │  Crisis signal classifier   │
   entry (journal/      │  (reads the text once,      │
   chat)                │   emits a structured        │
                        │   verdict; never converses) │
                        └──────────────┬──────────────┘
                                       │
                 risk = "none"         │        risk = anything else
              ┌────────────────────────┴───────────────────────┐
              ▼                                                 ▼
   ┌──────────────────────┐                      ┌──────────────────────────┐
   │  NORMAL FLOW          │                      │  FIREBREAK                │
   │  (journal, memory,    │                      │  1. Raw text → QUARANTINE │
   │   distiller, etc.)    │                      │     store ONLY            │
   └──────────────────────┘                      │  2. Scripted static       │
                                                  │     safety screen shown   │
                                                  │     (region-routed; the   │
                                                  │     screen never sees the │
                                                  │     user's text)          │
                                                  │  3. Proactive-contact     │
                                                  │     pause set (a date,    │
                                                  │     no content)           │
                                                  │  4. Structured safety     │
                                                  │     event logged (flags   │
                                                  │     only, no text)        │
                                                  │  5. STOP                  │
                                                  └──────────────────────────┘
```

Only the **classifier** and the **quarantine store** ever receive the raw
crisis text. Everything else downstream receives either nothing, or
non-text structured data (a risk label, a severity flag, a region code, a
date).

## Where crisis text goes (the complete list)

1. **The classifier.** It must read the text to classify it. The text is
   passed to a local `claude -p` subprocess on standard input (not as a
   command-line argument, so it cannot leak via process listings or
   shells). Classifier error messages are structural tokens only — they
   never embed the model's input or output.
2. **The quarantine store.** A dedicated database, reached only through a
   dedicated credential that has no read path for any other part of the
   system. Raw crisis text exists here and nowhere else. The starting
   retention posture is restrictive (see `data-retention-questions.md`).

That is the entire list. Two destinations.

## Where crisis text provably never goes

Each of these is a separate subsystem with **no credential, no import, and
no code path** to the quarantine store. A continuously-run test scans the
entire non-safety codebase and fails the build if any of them so much as
references the crisis store:

- `journal_entries` (the normal journal table)
- `chat_messages`
- the **distiller** (the component that summarizes entries over time)
- **embeddings** (vector representations used for search)
- **Qdrant** (the vector database / semantic memory store)
- **semantic memories** (the long-term memory records)
- **future-self generation** (projected-future-self letters)
- **retriever context** (what past material is surfaced into new sessions)
- **analytics** content
- application logs (crisis text is never written to a log line)

## The four isolated credentials

The isolation is by database permission, not by application logic. Four
separate credentials exist; no single one can do another's job:

| Credential (role) | Can do | Cannot do |
|---|---|---|
| application (normal) | read/write normal product data | **cannot read or write** the quarantine store |
| quarantine writer | **write** crisis text to the quarantine store | nothing else; not reused anywhere |
| safety-events appender | **append-only** structured safety events | cannot read, update, or delete them; no text column exists to write to |
| suppression writer | set/extend one date column ("paused until") | nothing else; column-scoped |

Defined in database migrations `0012` (quarantine store + writer role),
`0013` (append-only safety-events role), `0014` (column-scoped suppression
role). The structured safety-event record **has no field for raw text** —
leaking text into the audit log is not "discouraged," it is type-impossible.

## The non-text data that does flow downstream

So the reviewer knows exactly what *is* shared:

- **Risk label** (one of: none, suicidal_ideation, self_harm,
  abuse_disclosure, severe_acute_distress) — a category, not the words.
- **Severity flag** (none/low/medium/high).
- **Region code** (e.g. "US") — used to choose which static resource line
  to display. Never a guessed jurisdiction.
- **A pause-until date** — no content, no risk label attached; only "do
  not initiate contact until this date."
- **Structured safety-event row** — user id, risk type, severity, source
  (journal/chat), what response was shown, region of resources shown. No
  free text, no excerpt, no rawText field.

## The invariant restated

> Crisis material is acute-state material, not identity truth.

A person in crisis is not, for that reason, *defined* by the crisis. The
architecture refuses to let an acute moment become permanent identity data
the system reasons about later. The review may change policy values; it
should not breach this isolation.

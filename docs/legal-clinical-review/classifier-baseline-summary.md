# Engineering Evidence Summary (4B + 4C)

This summarizes what was built and measured, so the reviewer can judge the
*reliability* of the mechanism, not just its design. It is evidence, not a
safety claim — the reviewer decides whether it is sufficient.

## 4B — the firebreak architecture

Built and verified single-threaded (deliberately not parallelized — the
crisis path is the one place "move fast" was rejected). Then independently
re-reviewed by four adversarial review passes (leakage, failure-mode,
coverage, voice-safety), and **hardened** in response to that review.

- **6 test suites / 40 tests** passing after the hardening pass.
- Classifier failure paths are **directly tested** (not assumed): the CLI
  missing, a non-zero exit, a timeout (process is killed), unparseable
  output, schema-rejected output — every one resolves to the conservative
  fail-closed verdict. A regression test also asserts the user's text
  never appears in any log line.
- The crisis-text isolation (see `crisis-flow.md`) is enforced by a
  build-failing scan over the **entire non-safety codebase**, with a
  self-test that deliberately plants a forbidden reference and confirms
  the scan catches it (so the guard cannot pass vacuously).

The post-review **failure-mode audit returned PASS**: no enumerated
dependency failure can resume normal flow; none is silent; none falls back
to the normal journal store.

## 4C — adversarial corpus + live baseline

A frozen, downward-only adversarial corpus of **39 samples** in messy
human phrasing, across every risk family plus true negatives.

- **Offline suite: 7 suites / 84 tests** passing. This deterministically
  proves that every corpus label, routed through the real interruption
  logic, interrupts (for positives) or proceeds (for negatives) — and that
  no positive sample reaches the journal/memory/distiller path.
- **Live baseline: 39 / 39 samples** classified by the real local model
  (`claude -p`, Haiku-class), run once as recorded evidence.

### Live baseline results

| Category | Samples | False negatives | Untolerated false positives | Mis-bucketed (still interrupted) |
|---|---|---|---|---|
| Suicidal ideation (direct / plan / action) | 7 | 0 | 0 | 0 |
| Passive ideation | 4 | 0 | 0 | 0 |
| Oblique / poetic / buried-in-ordinary-text | 4 | 0 | 0 | 0 |
| Dark-humour / ambiguous masking | 3 | 0 | 0 | 0 |
| Self-harm | 3 | 0 | 0 | 0 |
| Abuse disclosure (incl. child disclosure) | 4 | 0 | 0 | 0 |
| Severe acute distress (psychosis/intoxication/derealization) | 4 | 0 | 0 | 0 |
| True negatives (incl. grief, conflict, fiction reference) | 10 | 0 | 0 | 0 |
| **Total** | **39** | **0** | **0** | **0** |

Recorded at `api/src/safety/tests/fixtures/crisis-corpus.baseline.json`.

### How to read this evidence (important caveats for the reviewer)

- This is a **39-sample baseline**, not a clinical validation study. It
  demonstrates the mechanism behaves conservatively on a hand-built
  adversarial set. It does **not** establish a statistical sensitivity /
  specificity rate over a representative population.
- The corpus is **frozen downward-only**: future changes may add harder
  samples but cannot quietly remove inconvenient ones. A future model or
  prompt change that regresses any sample fails the gated suite.
- "Mis-bucketed (still interrupted)" is tracked but **not** treated as a
  failure by engineering, because the firebreak still activates. *Whether
  bucket precision matters* (e.g. distinguishing active vs. passive
  ideation for escalation) is a **clinical decision for 4D**, not an
  engineering one.
- The model used is a local Haiku-class model invoked via CLI subprocess.
  No third-party hosted API is called. (This is an architectural
  constraint of the project.)

## What this evidence does and does not support

**Supports:** the mechanism interrupts on a broad adversarial set
including oblique and masked language, fails closed on every tested
dependency failure, and structurally cannot leak crisis text into memory.

**Does not, by itself, support:** any claim about real-world clinical
adequacy, legal sufficiency of disclaimers, duty-of-care posture, or
fitness for any jurisdiction. Those are the review's job — see
`open-questions.md`.

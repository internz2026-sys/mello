# Data Retention — Current Posture & Questions for Counsel

## The restrictive default (what the system does today)

Engineering adopted the **most restrictive defensible** retention posture
as a starting point — explicitly so that the review *loosens it
deliberately if law requires*, rather than *cleaning up a permissive
ambiguity*.

> **Default, non-optional:** quarantined crisis text is retained only as
> long as needed to (a) render the safety screen and (b) write the
> structured `safety_events` record. After that the raw text is purgeable
> on the same delete-cascade as all other user data. This is the starting
> posture, not a placeholder.

> **Default access:** no principal may read the quarantine store or the
> `safety_events` log beyond the append path. Fully closed. No human
> review, no real-time human in the loop.

4D may **deliberately extend** retention (e.g. if a duty-of-evidence
obligation exists) or **forbid retention entirely** — either is an
explicit decision over a known-restrictive default.

## What is stored, precisely

| Store | Contains | Credential access | Default retention |
|---|---|---|---|
| Quarantine store | the raw crisis text + structured fields (risk, severity, region, classifier confidence, user id) | write-only via a dedicated credential; **no read path** for any other subsystem | until bridge rendered + event written, then purgeable on delete-cascade |
| `safety_events` log | structured flags only: user id, risk type, severity, source, response taken, region shown. **No text column exists.** | append-only via a separate dedicated credential; cannot read/update/delete | per the structured-log retention the reviewer sets |
| Suppression state | one date column ("do not initiate contact until") — no content, no risk label | column-scoped writer credential | until the date elapses |

There is no other location where crisis text exists (see `crisis-flow.md`).

## Questions for counsel

1. **May raw crisis text be retained at all?** If not, the system must
   purge it the instant the bridge is rendered and the event written
   (mechanism already supports this).
2. **If retention is permitted, for how long, and on what legal basis?**
   (duty-of-evidence? incident investigation? none?)
3. **Does any jurisdiction require** retention (duty-of-evidence) — and
   does that conflict with another that requires deletion? How should a
   multi-jurisdiction conflict be resolved at launch scope?
4. **Who may access the quarantine store, ever?** Under what controls,
   logging, and authorization? (Default today: no one beyond the write
   path.)
5. **Who may access `safety_events`?** It contains no text but does record
   that a user had a crisis event of a given type on a given date — is
   that itself sensitive enough to restrict further?
6. **Delete-on-request interaction:** if a user requests account deletion,
   should crisis quarantine data be deleted on the same cascade, or is
   there a lawful basis / obligation to retain it separately? This
   directly conflicts with question 2/3 and needs an explicit ruling.
7. **The suppression date:** is storing "do not contact until <date>"
   (with no risk label or content) acceptable as non-sensitive, or does
   its mere existence imply a health inference that must be governed?
8. **Backups / logs:** confirm the retention ruling must also bind backups
   and any operational logs (engineering's design keeps crisis text out of
   logs entirely; backups of the quarantine store inherit its retention).

## Constraint on any answer

Whatever retention is set, it must not require crisis text to be copied
into any normal store to satisfy it. Retention can change *duration and
access* of the quarantine store; it must not relocate the data into
memory, analytics, or the journal to make retention "easier."

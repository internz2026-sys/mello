# 4D Review Packet — Export & Send Checklist

Operational checklist for turning the prepared packet into something
sendable to external counsel/clinician, and for routing it correctly.
This is process, not policy.

## A. Build the consolidated artifacts

The per-topic Markdown files are canonical. The single-file packet and
the PDF are **reproducible build outputs**.

- [ ] Run the builder:
      `python tools/build-review-packet.py`
- [ ] Confirm it produced:
  - [ ] `docs/legal-clinical-review/mello-4D-review-packet.md`
        (documents 1–9 concatenated in reading order, with cover + ToC)
  - [ ] `docs/legal-clinical-review/mello-4D-review-packet.pdf`
        (Chrome headless render of the above)
- [ ] Open the PDF; spot-check: cover page, table of contents, the
      data-flow ASCII diagram is monospaced/aligned, tables render,
      no truncated pages.
- [ ] Filename note: the on-disk name is ASCII (`mello-...`) for
      cross-tool safety; the document **title** inside reads "mellō".

> If Chrome is unavailable on the build machine, the `.md` is still
> authoritative and self-contained — any "print to PDF" path (browser,
> Word, Google Docs import) reproduces it. The PDF is convenience, not
> the source of truth.

## B. Pre-send review (engineering self-check — not approval)

- [ ] Positioning statement ("not therapy / not a crisis service / not
      medical advice") appears in the index AND the system summary.
- [ ] The "ask" is framed as *"what must change before launch?"*, not
      *"is this okay?"*.
- [ ] Every OPEN-4D item from `docs/safety-boundary.md` is represented in
      `open-questions.md` (severity thresholds, abuse-disclosure
      reporting, region default, persistent labelling, retention,
      human-review, low-confidence `risk:none`).
- [ ] `terms-disclaimer-draft.md` is clearly marked **non-authoritative
      draft**, on every clause.
- [ ] No engineering-invented policy: scan for any sentence that *decides*
      retention duration, reporting posture, or thresholds. There must be
      none — only restrictive defaults explicitly labelled as 4D
      parameters.
- [ ] Test-evidence caveats are present (the 39/39 baseline is described
      as a baseline, not a validation study).
- [ ] No raw crisis text, no real user data, anywhere in the packet
      (it is all synthetic corpus phrasing).

## C. Routing

- [ ] Identify the reviewer(s):
  - [ ] healthcare / mental-wellness attorney (required)
  - [ ] licensed clinician, suicide-risk triage familiarity (recommended)
  - [ ] privacy / data-protection advisor (required if launch spans
        multiple countries)
- [ ] Send the PDF (or the `.md`) + name the three highest-stakes
      documents explicitly in the cover note: **abuse-disclosure
      questions**, **data-retention questions**, **open-questions**.
- [ ] Cover-note one-liner (suggested): *"We are not asking whether to
      launch. We are asking, given exactly this behaviour, what must
      change before we may."*
- [ ] Ask the reviewer to answer **per numbered question**, so answers
      map back 1:1 to `open-questions.md`.

## D. On answers returned (do NOT start until then)

- [ ] Record answers against each question id in `open-questions.md`.
- [ ] Convert each answer into a concrete parameter value
      (`QUARANTINE_RETENTION`, `SAFETY_EVENTS_ON_DELETE`,
      severity thresholds, region default, low-confidence gate,
      `BACKUP_SHRED_HORIZON`).
- [ ] Only then unlock **STEP 4E** (final wording) and the **4D-gated
      arms of A2** (quarantine purge, safety_events cascade-vs-detach).
- [ ] Anything the review requires that would breach the core isolation
      → escalate as a finding; do not implement silently.

## E. Do NOT, while the packet is out for review

Start 4E wording · change classifier thresholds · build human-review
workflow · implement quarantine/safety_events retention · implement the
4D-gated A2 arms · alter any crisis data handling. These are locked
behind 4D by design.

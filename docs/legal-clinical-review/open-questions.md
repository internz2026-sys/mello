# Open Questions for the Attorney / Clinician

Every item here is a decision engineering **deliberately did not make**.
Each is phrased as a direct question. Where the system has a *default
posture* until the question is answered, that default is stated — and in
every case the default is the **most restrictive defensible** one, so the
review *grants* latitude deliberately rather than *discovering* that
latitude was already broad.

Legend: **[L]** legal · **[C]** clinical · **[L+C]** both.

## A. Positioning & duty of care

1. **[L]** Are the non-therapy / non-crisis-service / non-medical-advice
   disclaimers (see `terms-disclaimer-draft.md`) sufficient, and where
   must they appear (ToS, Privacy Policy, onboarding, crisis screen, app
   store listing)?
2. **[L]** Does offering a crisis interruption safeguard at all create a
   duty-of-care or assumed-responsibility exposure that *not* having one
   would not? Does the firebreak design mitigate or increase that?
3. **[L]** Is "route to resources, do not act for the user" (no contacting
   emergency services or third parties in v1) a defensible posture, and
   what is the legal weight of the deliberate choice **not** to escalate?
   *(Default: no third-party contact. OPEN — 4D.)*

## B. Classifier thresholds & low-confidence behaviour

4. **[C]** What should the severity thresholds be — what does `low` vs.
   `medium` vs. `high` trigger? *(Engineering ships the mechanism; the
   values are unset. OPEN — 4D.)*
5. **[L+C]** Is a well-formed but **low-confidence `risk:none`** result
   legally/clinically acceptable to treat as "proceed", or must low
   confidence force an interrupt? *(Default today: a well-formed `none`
   is trusted; a malformed/with-error response is treated as a crisis.
   The mechanism for a confidence floor is cheap to add; the threshold is
   a clinical/legal number, not an engineering guess. OPEN — 4D.)*
6. **[C]** Does the active-vs-passive suicidal-ideation distinction need
   to drive different behaviour, or is uniform interruption adequate for
   v1?

## C. Abuse disclosure (isolated — see `abuse-disclosure-questions.md`)

7. **[L]** Are abuse disclosures subject to mandatory-reporting
   obligations in any target jurisdiction, and if so, what is the
   product's obligation given it has no verified identity, location, or
   real-time human? *(Default: no reporting, no third-party contact, route
   to resources. Must be lawyer-defined, never assumed. OPEN — 4D.)*
8. **[L]** Does receiving a disclosure about a *third party* (e.g. "my
   child told me someone hurt them") change the obligation?

## D. Data retention & access (see `data-retention-questions.md`)

9. **[L]** May raw crisis text be retained in quarantine at all? If yes,
   for how long, and under what legal basis? *(Default: retained only as
   long as needed to render the bridge and write the structured event,
   then purgeable on the normal delete-cascade. 4D may extend if law
   requires duty-of-evidence, or forbid entirely. OPEN — 4D.)*
10. **[L]** Who, if anyone, may ever read the quarantine store or the
    `safety_events` log? *(Default: no principal may read either beyond
    the append path — fully closed. 4D grants access deliberately or not
    at all. OPEN — 4D.)*
11. **[L]** Should there be human review of crisis events? If so, under
    what conditions, cadence, and controls? *(Default: none; no real-time
    human in the loop. OPEN — 4D.)*
12. **[L]** Is persistent crisis-risk labelling of a *user* ever
    permissible? *(Default: the system flags the *entry*, never the
    *user*; the only cross-session state is a contentless "do not initiate
    contact until <date>" pause. OPEN — 4D, given privacy/stigma stakes.)*

## E. Region & resources

13. **[L+C]** What is acceptable default/fallback behaviour when the
    user's region is unknown? *(Default: a jurisdiction-neutral line; the
    system must **not** guess a country's crisis infrastructure. OPEN —
    4D.)*
14. **[C]** Which resource lines are correct and current for each launch
    jurisdiction (the displayed numbers/services)? Final list is OPEN — 4D
    and must be jurisdiction-checked.

## F. Wording

15. **[L+C]** Final wording of: the scripted crisis screen, the holding
    screen shown on dependency failure, the minimal static fallback
    screen, the screen-state choice ("keep resources visible / quiet the
    screen"), the post-crisis state, and all disclaimers. *(Engineering
    has placeholders only; all crisis wording is FROZEN until this review.
    OPEN — 4D, finalized in 4E.)*

## G. Launch scope

16. **[L]** Which jurisdictions must be **excluded** at launch until
    separately reviewed (e.g. jurisdictions with strict mandatory-reporting
    or digital-health regimes)?
17. **[L]** Are there age-gating or minor-protection obligations that
    change any of the above?

---

### Engineering's standing constraint on the answers

The review may set or change retention, wording, resources, thresholds,
escalation policy, and launch jurisdictions. The review should **not**
result in crisis text re-entering memory, embeddings, retrieval,
future-self generation, or reflective prompting. If a required answer
would breach that isolation, that is itself a finding to surface, not a
change to make silently.

**4D is not complete until these are answered by qualified external
review.** Engineering will not invent any of them.

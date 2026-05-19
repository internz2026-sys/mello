/**
 * Crisis bridge templates — STATIC strings only. safety-boundary.md v0.2 §8.
 *
 * FROZEN until STEP 4D (legal review). No model output, ever. No companion
 * or presence language ("I'm here", "stay with you", "I'll be here"). No
 * grounding loop. No reflective questioning. The fork is about the INTERFACE
 * STATE, not about mellō accompanying the user.
 *
 * `{resource}` is the only interpolation slot; it is filled from the static
 * resource resolver, never from a model.
 */

/** Step 1 — interrupt + route. Always shown on a positive verdict. */
export const BRIDGE_STEP1 =
  "I'm reading carefully. Before anything else — are you safe right now? " +
  'If you might not be, please reach a person now: {resource}.';

/** Step 2 — the interface-state fork (NOT companionship). */
export const BRIDGE_FORK_PROMPT =
  'You can keep the support options on screen, or close this and let it ' +
  'be quiet. Either is okay.';

export const BRIDGE_OPTION_KEEP = { id: 'keep' as const, label: 'Keep this here' };
export const BRIDGE_OPTION_QUIET = { id: 'quiet' as const, label: 'Quiet' };

/** "Keep this here" → resources stay on a still screen. The screen does
 *  not speak: no generated lines, no presence language, nothing asked. */
export const BRIDGE_KEEP_SCREEN = 'Support options: {resource}.';

/** "Quiet" → static pause screen, one line, no prompting of any kind. */
export const BRIDGE_QUIET_SCREEN =
  'This will be here when you come back. Nothing you wrote is going anywhere.';

/** §7 — shown when a safety-critical dependency fails (classifier outage,
 *  malformed response). Fail closed, not cold. */
export const BRIDGE_HOLDING_MESSAGE =
  'Something interrupted things just now. Before anything else — if you ' +
  'might not be safe, please reach a person now: {resource}. ' +
  'What you wrote is held and going nowhere.';

/** §7 — absolute last resort if even template assembly fails. A minimal
 *  static safety screen; never falls through to the normal product UI. */
export const MINIMAL_STATIC_SAFETY_SCREEN =
  'If you might not be safe, please reach local emergency services or a ' +
  'crisis line near you now.';

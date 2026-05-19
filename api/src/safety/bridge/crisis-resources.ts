/**
 * Crisis resources — STATIC data only. No model, no network, no lookup
 * service that can fail open. safety-boundary.md v0.2 §8.
 *
 * PROVISIONAL / OPEN — 4D: the authoritative, jurisdiction-verified list is
 * a legal/clinical deliverable (STEP 4D). Only lines that are widely
 * verifiable are seeded here. Per §8: never display a region's line unless
 * verified for that region — so an unknown/unverified region falls back to
 * a generic message with NO specific number (no number is globally
 * correct, and a wrong number in a crisis is worse than none).
 */

const VERIFIED_REGION_LINES: Readonly<Record<string, string>> = Object.freeze({
  US: '988 — call or text (Suicide & Crisis Lifeline)',
  UK: 'Samaritans — call 116 123',
});

/**
 * Jurisdiction-neutral fallback. No specific number by design (§7:
 * region-resource lookup failure → generic guidance, never an unverified
 * or empty line). Final wording OPEN — 4D.
 */
export const JURISDICTION_NEUTRAL_LINE =
  'reach local emergency services or a crisis line near you';

/**
 * Pure, total function. Any region not explicitly verified — including
 * 'UNKNOWN', undefined, or anything not in the map — returns the
 * jurisdiction-neutral line. Never throws, never returns empty.
 */
export function resolveResourceLine(region?: string): string {
  if (!region) return JURISDICTION_NEUTRAL_LINE;
  const key = region.trim().toUpperCase();
  return VERIFIED_REGION_LINES[key] ?? JURISDICTION_NEUTRAL_LINE;
}

import { z } from 'zod';

/**
 * Canonical crisis contract. Mirrors docs/safety-boundary.md v0.2 §4.
 * The classifier emits a STRUCTURED VERDICT only — no freeform prose field
 * by design (minimizes hallucination surface).
 *
 * `severe_acute_distress` doubles as the uncategorized-acute catch-all
 * bucket (psychosis/delusion/intoxication/incoherent/ambiguous) — §4.
 */

export const CrisisRiskSchema = z.enum([
  'none',
  'suicidal_ideation',
  'self_harm',
  'abuse_disclosure',
  'severe_acute_distress',
]);
export type CrisisRisk = z.infer<typeof CrisisRiskSchema>;

export const CrisisSeveritySchema = z.enum(['none', 'low', 'medium', 'high']);
export type CrisisSeverity = z.infer<typeof CrisisSeveritySchema>;

export const CrisisVerdictSchema = z
  .object({
    risk: CrisisRiskSchema,
    severity: CrisisSeveritySchema,
    interrupt: z.boolean(),
    allow_distillation: z.boolean(),
    allow_memory: z.boolean(),
    resource_region: z.string(),
    confidence: z.number().min(0).max(1),
  })
  .strict();
export type CrisisVerdict = z.infer<typeof CrisisVerdictSchema>;

export const ClassifySafetyInputSchema = z
  .object({
    body: z.string().min(1).max(20_000),
    context: z.enum(['journal', 'chat', 'letter', 'onboarding']).optional(),
    resource_region: z.string().optional(),
  })
  .strict();
export type ClassifySafetyInput = z.infer<typeof ClassifySafetyInputSchema>;

/**
 * The deterministic fail-closed verdict. Returned on classifier outage OR
 * malformed/unparseable response — treated IDENTICALLY (§7). Never
 * optimistically `none`. This is the uncategorized-acute catch-all in
 * constant form: full firebreak, memory paths shut.
 */
export const FAIL_CLOSED_VERDICT: CrisisVerdict = Object.freeze({
  risk: 'severe_acute_distress',
  severity: 'high',
  interrupt: true,
  allow_distillation: false,
  allow_memory: false,
  resource_region: 'UNKNOWN',
  confidence: 0,
});

/**
 * Enforce the §4 hard invariant in code, never trusting the model to set
 * the safety-critical booleans. Any non-`none` risk forces the full
 * firebreak regardless of what the model returned.
 */
export function enforceVerdictInvariants(v: CrisisVerdict): CrisisVerdict {
  if (v.risk === 'none') return v;
  return {
    ...v,
    interrupt: true,
    allow_distillation: false,
    allow_memory: false,
  };
}

// Back-compat alias (old name); identical to the verdict now.
export type SafetyClassification = CrisisVerdict;
export const SafetyClassificationSchema = CrisisVerdictSchema;

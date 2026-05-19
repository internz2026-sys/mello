import type { CrisisRisk, CrisisSeverity } from '../../schemas';

/**
 * Quarantine input. `rawText` is crisis-flagged text — by
 * safety-boundary.md v0.2 §9 it lives ONLY in quarantine.crisis_entries,
 * nowhere the distiller/retriever/embedding paths can reach.
 */
export interface QuarantineInput {
  userId: string;
  rawText: string;
  risk: CrisisRisk;
  severity: CrisisSeverity;
  resourceRegion?: string;
  classifierConfidence?: number;
  /** §10 restrictive retention default; caller sets the short horizon. */
  purgeAfter?: Date;
}

/**
 * Structured result only. There is no "wrote it somewhere else" success
 * state — either it persisted to the quarantine store, or it failed
 * closed and the caller must follow §7 (no normal storage, no distill,
 * no embed, no memory, no resumed flow).
 */
export type QuarantineResult =
  | { status: 'persisted'; crisisEntryId: string }
  | { status: 'failed_closed'; reason: string };

/**
 * Low-level writer. Every implementation MUST target ONLY
 * `quarantine.crisis_entries` via the dedicated quarantine credential
 * (QUARANTINE_DATABASE_URL). It must never accept a connection shared
 * with the normal app / distiller / retriever path.
 */
export interface QuarantineStore {
  insertCrisisEntry(input: QuarantineInput): Promise<{ id: string }>;
}

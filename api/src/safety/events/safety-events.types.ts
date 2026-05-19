import type { CrisisRisk } from '../../schemas';

/**
 * Structured safety-event input. safety-boundary.md v0.2 §9: structured
 * flags ONLY. There is deliberately NO raw-text field on this type — the
 * type system itself makes it impossible to pass user prose into the audit
 * log. Raw text lives only in quarantine.crisis_entries.
 */

/** Enumerated structured token — never free prose. */
export type SafetyResponseTaken =
  | 'firebreak:bridge_shown'
  | 'firebreak:quarantined'
  | 'firebreak:failed_closed'
  | 'firebreak:holding_shown';

export type SafetyEventSource = 'journal' | 'chat' | 'manual' | 'onboarding';

export interface SafetyEventInput {
  userId: string;
  /** = the classifier verdict's risk; a controlled enum value, not prose. */
  signalType: Exclude<CrisisRisk, 'none'>;
  severity: 'low' | 'medium' | 'high';
  source: SafetyEventSource;
  sourceId?: string;
  responseTaken: SafetyResponseTaken;
  /** Structured tokens only, e.g. ['region:US'] / ['region:neutral']. */
  resourcesShown?: string[];
  escalatedToHuman?: boolean;
}

export type SafetyEventResult =
  | { status: 'appended'; eventId: string }
  | { status: 'append_failed'; reason: string };

/**
 * INSERT-only writer. Implementations connect via the
 * mello_safety_events_append credential and may ONLY insert into
 * public.safety_events. No select/update/delete, no other table.
 */
export interface SafetyEventStore {
  appendEvent(input: SafetyEventInput): Promise<{ id: string }>;
}

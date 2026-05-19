import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

import type {
  SafetyEventInput,
  SafetyEventResult,
  SafetyEventStore,
} from './safety-events.types';

/** The ONLY table this module may write. Named once, here, for inspection. */
const SAFETY_EVENTS_TABLE = 'public.safety_events';

/**
 * Postgres-backed append store. Dedicated pool from
 * SAFETY_EVENTS_DATABASE_URL only (the mello_safety_events_append
 * INSERT-only credential — migration 0013). No fallback to the main or
 * quarantine connection. If the dedicated URL is absent, this throws and
 * the service degrades to append_failed (never silently reuses another DB).
 */
class PgSafetyEventStore implements SafetyEventStore {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (this.pool) return this.pool;
    const url = process.env.SAFETY_EVENTS_DATABASE_URL;
    if (!url) {
      throw new Error(
        'SAFETY_EVENTS_DATABASE_URL is not set — refusing to reuse the main ' +
          'or quarantine connection for the audit log.',
      );
    }
    this.pool = new Pool({ connectionString: url, max: 2 });
    return this.pool;
  }

  async appendEvent(input: SafetyEventInput): Promise<{ id: string }> {
    const pool = this.getPool();
    // INSERT only. Structured columns only. No raw-text column referenced.
    const res = await pool.query<{ id: string }>(
      `insert into ${SAFETY_EVENTS_TABLE}
         (user_id, signal_type, source, source_id, severity,
          response_taken, resources_shown, escalated_to_human)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        input.userId,
        input.signalType,
        input.source,
        input.sourceId ?? null,
        input.severity,
        input.responseTaken,
        input.resourcesShown ?? null,
        input.escalatedToHuman ?? false,
      ],
    );
    const id = res.rows[0]?.id;
    if (!id) throw new Error('safety_events insert returned no id');
    return { id };
  }
}

/**
 * SafetyEventsAppendService — 4B.5. Structured-flags-only audit append.
 *
 * §7 CONTRACT: this method NEVER throws. A `safety_events` append failure
 * must NOT un-pause safety behaviour — the caller still quarantines, still
 * shows the bridge, still pauses flow; the missing audit row is retried
 * out of band. So append() always resolves to a structured result and the
 * orchestrator treats `append_failed` as non-blocking.
 *
 * Imports nothing from reflection / memory / distiller / retriever.
 */
@Injectable()
export class SafetyEventsAppendService {
  private readonly log = new Logger(SafetyEventsAppendService.name);

  constructor(
    private readonly store: SafetyEventStore = new PgSafetyEventStore(),
  ) {}

  async append(input: SafetyEventInput): Promise<SafetyEventResult> {
    try {
      const { id } = await this.store.appendEvent(input);
      return { status: 'appended', eventId: id };
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      // Non-blocking by contract: log + structured result, never throw.
      // The firebreak (quarantine + bridge + pause) does not depend on this.
      this.log.error(
        `safety_events append failed (non-blocking; retry out of band): ${reason}`,
      );
      return { status: 'append_failed', reason };
    }
  }
}

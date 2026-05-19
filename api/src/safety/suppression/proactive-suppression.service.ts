import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';

import type {
  ProactiveSuppressionPort,
  SuppressionResult,
} from './proactive-suppression.types';

const PROFILES_TABLE = 'public.profiles';

/** Window length is OPEN — 4D (clinical). Default is a deterministic
 *  placeholder; the MECHANISM is fixed, the number is not policy. */
const DEFAULT_PAUSE_DAYS = Number(
  process.env.MELLO_PROACTIVE_PAUSE_DAYS || 14,
);

/**
 * ProactiveSuppressionService — 4B.6 (safety-boundary.md v0.2 §6.5).
 *
 * Dedicated SUPPRESSION_DATABASE_URL pool (mello_suppression_rw,
 * column-scoped). Never reuses the app/quarantine/events connections.
 *
 * Fail-safe direction is SILENCE: if suppression state cannot be read,
 * the scheduler is told "paused" (true). Not contacting someone who may
 * have just had a crisis is the safe failure; the haunting-the-morning-
 * after risk is the one we refuse to take.
 *
 * Monotonic: a pause is only ever EXTENDED, never shortened — a later
 * crisis cannot reduce an earlier, longer pause.
 */
@Injectable()
export class ProactiveSuppressionService implements ProactiveSuppressionPort {
  private readonly log = new Logger(ProactiveSuppressionService.name);
  private pool: Pool | null = null;

  /** now + default window. The middleware calls this for the pause horizon. */
  defaultPauseUntil(now: Date = new Date()): Date {
    return new Date(now.getTime() + DEFAULT_PAUSE_DAYS * 86_400_000);
  }

  private getPool(): Pool {
    if (this.pool) return this.pool;
    const url = process.env.SUPPRESSION_DATABASE_URL;
    if (!url) {
      throw new Error(
        'SUPPRESSION_DATABASE_URL is not set — refusing to reuse another ' +
          'connection for the suppression flag.',
      );
    }
    this.pool = new Pool({ connectionString: url, max: 2 });
    return this.pool;
  }

  async pauseProactiveEngagement(
    userId: string,
    until: Date,
  ): Promise<SuppressionResult> {
    try {
      const pool = this.getPool();
      // Monotonic: GREATEST(existing, requested). NULL existing → requested.
      await pool.query(
        `update ${PROFILES_TABLE}
            set proactive_engagement_paused_until =
              greatest(
                coalesce(proactive_engagement_paused_until, to_timestamp(0)),
                $2::timestamptz
              )
          where id = $1`,
        [userId, until.toISOString()],
      );
      return { status: 'paused', until: until.toISOString() };
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      // Non-blocking: the bridge is already shown. Surface so the
      // orchestrator can log it to safety_events.
      this.log.error(
        `proactive suppression set failed (surface to safety_events): ${reason}`,
      );
      return { status: 'failed', reason };
    }
  }

  async isProactiveEngagementPaused(userId: string): Promise<boolean> {
    try {
      const pool = this.getPool();
      const res = await pool.query<{ paused_until: string | null }>(
        `select proactive_engagement_paused_until as paused_until
           from ${PROFILES_TABLE} where id = $1`,
        [userId],
      );
      const v = res.rows[0]?.paused_until;
      if (!v) return false;
      return new Date(v).getTime() > Date.now();
    } catch (e) {
      // Fail-safe toward SILENCE. Cannot determine → treat as paused.
      this.log.error(
        `suppression read failed → fail-safe paused=true: ${String(e)}`,
      );
      return true;
    }
  }
}

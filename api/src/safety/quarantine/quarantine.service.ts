import { Injectable, Logger, Optional } from '@nestjs/common';
import { Pool } from 'pg';

import type {
  QuarantineInput,
  QuarantineResult,
  QuarantineStore,
} from './quarantine.types';

/**
 * The ONLY table this module is allowed to touch. Named once, here, so the
 * leakage test (4B.7) and any reader can verify by inspection that no
 * normal-flow table is reachable from quarantine.
 */
const QUARANTINE_TABLE = 'quarantine.crisis_entries';

/**
 * Postgres-backed quarantine store. Uses a DEDICATED pool built only from
 * QUARANTINE_DATABASE_URL — the credential boundary from
 * safety-boundary.md v0.2 §9 enforced in code. The rest of the app holds
 * no reference to this pool. If the dedicated URL is absent, this throws:
 * there is deliberately NO fallback to the main database connection.
 */
class PgQuarantineStore implements QuarantineStore {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (this.pool) return this.pool;
    const url = process.env.QUARANTINE_DATABASE_URL;
    if (!url) {
      // No fallback. Absence of the dedicated credential is a fail-closed
      // condition, never a reason to reuse the main DB.
      throw new Error(
        'QUARANTINE_DATABASE_URL is not set — refusing to fall back to the ' +
          'main database. Crisis text has no safe destination; fail closed.',
      );
    }
    this.pool = new Pool({ connectionString: url, max: 2 });
    return this.pool;
  }

  async insertCrisisEntry(input: QuarantineInput): Promise<{ id: string }> {
    const pool = this.getPool();
    const res = await pool.query<{ id: string }>(
      `insert into ${QUARANTINE_TABLE}
         (user_id, raw_text, risk, severity, resource_region,
          classifier_conf, purge_after)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id`,
      [
        input.userId,
        input.rawText,
        input.risk,
        input.severity,
        input.resourceRegion ?? null,
        input.classifierConfidence ?? null,
        input.purgeAfter ?? null,
      ],
    );
    const id = res.rows[0]?.id;
    if (!id) throw new Error('quarantine insert returned no id');
    return { id };
  }
}

/**
 * QuarantineService — 4B.2. The physical containment boundary
 * safety-boundary.md v0.2 §9 promises.
 *
 * Contract: write detected crisis material ONLY to the quarantine store
 * via the dedicated credential. On ANY failure, return `failed_closed` —
 * never write to journal_entries / chat_messages / memories, never embed,
 * never distill, never fall back to normal Postgres durability. Volatile
 * loss of an unpersisted crisis entry is acceptable (§7); leakage into the
 * memory engine is not.
 *
 * This file imports nothing from reflection / memory / distiller / retriever
 * by design. The only table it can name is QUARANTINE_TABLE.
 */
@Injectable()
export class QuarantineService {
  private readonly log = new Logger(QuarantineService.name);

  // @Optional(): `QuarantineStore` is a TS interface (no DI token), so
  // Nest cannot inject it. @Optional() makes Nest pass undefined and the
  // default PgQuarantineStore() applies — identical to the unit-test
  // path. No crisis behaviour changes; the dedicated-credential store is
  // unchanged. (S5/STEP-8 DI plumbing for the pre-existing 4B wiring.)
  constructor(
    @Optional() private readonly store: QuarantineStore = new PgQuarantineStore(),
  ) {}

  async quarantineCrisisEntry(
    input: QuarantineInput,
  ): Promise<QuarantineResult> {
    try {
      const { id } = await this.store.insertCrisisEntry(input);
      return { status: 'persisted', crisisEntryId: id };
    } catch (e) {
      // §7: fail closed. Do NOT write anywhere else. Do NOT resume flow.
      const reason = e instanceof Error ? e.message : String(e);
      this.log.error(
        `quarantine write failed → failed_closed (no fallback): ${reason}`,
      );
      return { status: 'failed_closed', reason };
    }
  }
}

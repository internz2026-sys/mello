import * as fs from 'node:fs';
import * as path from 'node:path';

import { QuarantineService } from '../quarantine/quarantine.service';
import type {
  QuarantineInput,
  QuarantineStore,
} from '../quarantine/quarantine.types';

const sampleInput: QuarantineInput = {
  userId: '00000000-0000-0000-0000-000000000001',
  rawText: 'crisis-flagged text that must never leave quarantine',
  risk: 'suicidal_ideation',
  severity: 'high',
  resourceRegion: 'US',
  classifierConfidence: 0.9,
};

describe('QuarantineService (4B.2)', () => {
  it('persists via the store and returns the crisis entry id', async () => {
    const store: QuarantineStore = {
      insertCrisisEntry: jest.fn().mockResolvedValue({ id: 'q-123' }),
    };
    const svc = new QuarantineService(store);
    const result = await svc.quarantineCrisisEntry(sampleInput);
    expect(result).toEqual({ status: 'persisted', crisisEntryId: 'q-123' });
    expect(store.insertCrisisEntry).toHaveBeenCalledTimes(1);
  });

  it('fails closed (no fallback) when the store throws', async () => {
    const store: QuarantineStore = {
      insertCrisisEntry: jest
        .fn()
        .mockRejectedValue(new Error('db unreachable')),
    };
    const svc = new QuarantineService(store);
    const result = await svc.quarantineCrisisEntry(sampleInput);
    expect(result.status).toBe('failed_closed');
    if (result.status === 'failed_closed') {
      expect(result.reason).toContain('db unreachable');
    }
  });

  it('fails closed when QUARANTINE_DATABASE_URL is absent — no main-DB fallback', async () => {
    const prev = process.env.QUARANTINE_DATABASE_URL;
    delete process.env.QUARANTINE_DATABASE_URL;
    try {
      const svc = new QuarantineService(); // default PgQuarantineStore
      const result = await svc.quarantineCrisisEntry(sampleInput);
      expect(result.status).toBe('failed_closed');
      if (result.status === 'failed_closed') {
        expect(result.reason).toMatch(/QUARANTINE_DATABASE_URL/);
      }
    } finally {
      if (prev !== undefined) process.env.QUARANTINE_DATABASE_URL = prev;
    }
  });

  it('CODE (comments stripped) names no normal-flow table and imports no memory-engine module', () => {
    const dir = path.join(__dirname, '..', 'quarantine');
    const raw = ['quarantine.service.ts', 'quarantine.types.ts']
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf-8'))
      .join('\n');

    // Strip comments. Docstrings legitimately explain the boundary by
    // naming the tables we must never touch; only real code matters.
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    // The quarantine table IS named in real code (the QUARANTINE_TABLE const).
    expect(code).toContain('quarantine.crisis_entries');

    // Normal-flow tables and memory-engine import paths must not appear
    // anywhere in the actual code of the quarantine module.
    for (const forbidden of [
      'journal_entries',
      'chat_messages',
      'public.memories',
      '../reflection',
      '../memory',
      '../retrieval',
      '../future-self',
      'distiller',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});

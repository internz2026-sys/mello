import * as fs from 'node:fs';
import * as path from 'node:path';

import { SafetyEventsAppendService } from '../events/safety-events.service';
import type {
  SafetyEventInput,
  SafetyEventStore,
} from '../events/safety-events.types';

const input: SafetyEventInput = {
  userId: '00000000-0000-0000-0000-000000000001',
  signalType: 'suicidal_ideation',
  severity: 'high',
  source: 'journal',
  responseTaken: 'firebreak:quarantined',
  resourcesShown: ['region:US'],
};

describe('SafetyEventsAppendService (4B.5)', () => {
  it('appends and returns the event id', async () => {
    const store: SafetyEventStore = {
      appendEvent: jest.fn().mockResolvedValue({ id: 'ev-1' }),
    };
    const svc = new SafetyEventsAppendService(store);
    await expect(svc.append(input)).resolves.toEqual({
      status: 'appended',
      eventId: 'ev-1',
    });
  });

  it('NEVER throws — append failure returns a structured non-blocking result', async () => {
    const store: SafetyEventStore = {
      appendEvent: jest.fn().mockRejectedValue(new Error('audit db down')),
    };
    const svc = new SafetyEventsAppendService(store);
    // The §7 contract: must not throw, so the firebreak path is never blocked.
    const result = await svc.append(input);
    expect(result.status).toBe('append_failed');
    if (result.status === 'append_failed') {
      expect(result.reason).toContain('audit db down');
    }
  });

  it('fails non-blocking when SAFETY_EVENTS_DATABASE_URL is absent (no DB reuse)', async () => {
    const prev = process.env.SAFETY_EVENTS_DATABASE_URL;
    delete process.env.SAFETY_EVENTS_DATABASE_URL;
    try {
      const svc = new SafetyEventsAppendService(); // default PgSafetyEventStore
      const result = await svc.append(input);
      expect(result.status).toBe('append_failed');
      if (result.status === 'append_failed') {
        expect(result.reason).toMatch(/SAFETY_EVENTS_DATABASE_URL/);
      }
    } finally {
      if (prev !== undefined) process.env.SAFETY_EVENTS_DATABASE_URL = prev;
    }
  });

  it('CODE references only public.safety_events, no raw-text column, INSERT-only, no memory-engine import', () => {
    const dir = path.join(__dirname, '..', 'events');
    const code = ['safety-events.service.ts', 'safety-events.types.ts']
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf-8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    expect(code).toContain('public.safety_events');

    // No raw user-text columns in the audit insert.
    for (const rawCol of ['raw_text', 'entry_text', ' body', 'content,']) {
      expect(code).not.toContain(rawCol);
    }
    // Append-only: no read/mutate SQL against safety_events in this module.
    for (const sql of [
      'select ',
      'update public.safety_events',
      'delete from public.safety_events',
    ]) {
      expect(code.toLowerCase()).not.toContain(sql);
    }
    // No memory-engine / quarantine cross-imports.
    for (const bad of [
      '../reflection',
      '../memory',
      '../retrieval',
      '../future-self',
      '../quarantine',
      'distiller',
    ]) {
      expect(code).not.toContain(bad);
    }
  });
});

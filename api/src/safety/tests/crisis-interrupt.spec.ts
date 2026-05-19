import * as fs from 'node:fs';
import * as path from 'node:path';

import { FAIL_CLOSED_VERDICT, type CrisisVerdict } from '../../schemas';
import {
  CrisisInterruptService,
  type ScreenInput,
} from '../middleware/crisis-interrupt.middleware';

const NONE: CrisisVerdict = {
  risk: 'none',
  severity: 'none',
  interrupt: false,
  allow_distillation: true,
  allow_memory: true,
  resource_region: 'US',
  confidence: 0.9,
};
const POSITIVE: CrisisVerdict = {
  risk: 'suicidal_ideation',
  severity: 'high',
  interrupt: true,
  allow_distillation: false,
  allow_memory: false,
  resource_region: 'US',
  confidence: 0.8,
};

const input: ScreenInput = {
  userId: 'u-1',
  text: 'CRISIS RAW TEXT — must reach only quarantine',
  source: 'journal',
};

function build(verdict: CrisisVerdict, overrides: Record<string, any> = {}) {
  const classify = jest.fn().mockResolvedValue(verdict);
  const quarantineCrisisEntry = jest
    .fn()
    .mockResolvedValue({ status: 'persisted', crisisEntryId: 'q1' });
  const renderBridge = jest.fn().mockReturnValue({
    step1: 's1',
    fork: { prompt: 'p', options: [] },
    keepScreen: 'k',
    quietScreen: 'q',
  });
  const append = jest
    .fn()
    .mockResolvedValue({ status: 'appended', eventId: 'e1' });
  const pauseProactiveEngagement = jest
    .fn()
    .mockResolvedValue({ status: 'paused', until: '2026-06-01T00:00:00Z' });
  const defaultPauseUntil = jest.fn().mockReturnValue(new Date('2026-06-01'));

  const deps = {
    classifier: { classify, ...overrides.classifier },
    quarantine: { quarantineCrisisEntry, ...overrides.quarantine },
    bridge: {
      renderBridge,
      minimalStaticSafetyScreen: 'MIN',
      ...overrides.bridge,
    },
    events: { append, ...overrides.events },
    suppression: {
      pauseProactiveEngagement,
      defaultPauseUntil,
      ...overrides.suppression,
    },
  };
  const svc = new CrisisInterruptService(
    deps.classifier as any,
    deps.quarantine as any,
    deps.bridge as any,
    deps.events as any,
    deps.suppression as any,
  );
  return { svc, ...deps };
}

describe('CrisisInterruptService (4B.3 — the keystone)', () => {
  it('risk=none is the ONLY proceed path; no firebreak component is touched', async () => {
    const t = build(NONE);
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('proceed');
    expect(t.quarantine.quarantineCrisisEntry).not.toHaveBeenCalled();
    expect(t.bridge.renderBridge).not.toHaveBeenCalled();
    expect(t.suppression.pauseProactiveEngagement).not.toHaveBeenCalled();
    expect(t.events.append).not.toHaveBeenCalled();
  });

  it('positive verdict → firebreak; raw text goes ONLY to quarantine', async () => {
    const t = build(POSITIVE);
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
    expect(t.quarantine.quarantineCrisisEntry).toHaveBeenCalledWith(
      expect.objectContaining({ rawText: input.text }),
    );
    // The audit append must never receive raw text.
    const eventArg = t.events.append.mock.calls[0][0];
    expect(JSON.stringify(eventArg)).not.toContain(input.text);
    expect('rawText' in eventArg).toBe(false);
  });

  it('classifier fail-closed verdict → firebreak, NEVER proceed', async () => {
    const t = build(FAIL_CLOSED_VERDICT);
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
  });

  it('quarantine failed_closed → still firebreak; event records failed_closed', async () => {
    const t = build(POSITIVE, {
      quarantine: {
        quarantineCrisisEntry: jest
          .fn()
          .mockResolvedValue({ status: 'failed_closed', reason: 'db down' }),
      },
    });
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
    if (d.decision === 'firebreak') expect(d.quarantine).toBe('failed_closed');
    expect(t.events.append).toHaveBeenCalledWith(
      expect.objectContaining({ responseTaken: 'firebreak:failed_closed' }),
    );
  });

  it('suppression failure and event failure are non-blocking; decision stays firebreak', async () => {
    const t = build(POSITIVE, {
      suppression: {
        pauseProactiveEngagement: jest
          .fn()
          .mockResolvedValue({ status: 'failed', reason: 'x' }),
        defaultPauseUntil: jest.fn().mockReturnValue(new Date()),
      },
      events: {
        append: jest
          .fn()
          .mockResolvedValue({ status: 'append_failed', reason: 'y' }),
      },
    });
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
    if (d.decision === 'firebreak') {
      expect(d.suppression).toBe('failed');
      expect(d.event).toBe('append_failed');
      // Invariant: memory paths shut on any firebreak.
      expect(d.verdict.allow_distillation).toBe(false);
      expect(d.verdict.allow_memory).toBe(false);
    }
  });

  it('INVARIANT: total downstream failure with a positive verdict still never proceeds', async () => {
    const t = build(POSITIVE, {
      quarantine: {
        quarantineCrisisEntry: jest
          .fn()
          .mockResolvedValue({ status: 'failed_closed', reason: 'q' }),
      },
      suppression: {
        pauseProactiveEngagement: jest
          .fn()
          .mockResolvedValue({ status: 'failed', reason: 's' }),
        defaultPauseUntil: jest.fn().mockReturnValue(new Date()),
      },
      events: {
        append: jest
          .fn()
          .mockResolvedValue({ status: 'append_failed', reason: 'e' }),
      },
    });
    const d = await t.svc.screen(input);
    expect(d.decision).not.toBe('proceed');
    expect(d.decision).toBe('firebreak');
  });

  it('the middleware imports no memory-engine module', () => {
    const code = fs
      .readFileSync(
        path.join(__dirname, '..', 'middleware', 'crisis-interrupt.middleware.ts'),
        'utf-8',
      )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    for (const bad of [
      '../../distiller',
      'distiller',
      "from '../memory'",
      "from '../retrieval'",
      "from '../../reflection'",
      "from '../reflection'",
    ]) {
      expect(code).not.toContain(bad);
    }
  });
});

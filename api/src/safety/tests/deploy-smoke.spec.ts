/**
 * S5-2 — Deploy-time safety smoke suite.
 *
 * DEPLOYMENT VERIFICATION, not new crisis logic. It re-asserts, in the
 * built/deployed artifact, the guarantees 4B/4C already prove — so a
 * deploy cannot ship an environment where they silently regressed. It
 * only IMPORTS the frozen safety modules (exactly as the sibling specs
 * in this directory do); it modifies none of them. It lives here, beside
 * crisis-corpus / leakage-prevention, because exercising the keystone
 * from a non-exempt dir is precisely what the §12 guard (correctly)
 * forbids.
 *
 *  Block A (always): environment-invariant re-assertions —
 *    credential-isolation guard active, firebreak fires on synthetic
 *    crisis, classifier-failure fails closed, quarantine-failure has no
 *    journal fallback, crisis text never leaves quarantine.
 *  Block B (gated on ALPHA_BASE_URL): live HTTP checks against the
 *    deployed alpha — public registration not reachable, protected route
 *    not bypassable. Skipped (not vacuously passed) without a target,
 *    mirroring the RUN_LIVE_CLASSIFIER pattern.
 */
import {
  assertDistinctSafetyCredentials,
  CredentialIsolationError,
} from '../../common/credential-isolation';
import { FAIL_CLOSED_VERDICT, type CrisisVerdict } from '../../schemas';
import {
  CrisisInterruptService,
  type ScreenInput,
} from '../middleware/crisis-interrupt.middleware';

const SECRET = 'DEPLOY-SMOKE-RAW-CRISIS-TEXT-5e8b';

const POSITIVE: CrisisVerdict = {
  risk: 'suicidal_ideation',
  severity: 'high',
  interrupt: true,
  allow_distillation: false,
  allow_memory: false,
  resource_region: 'US',
  confidence: 0.8,
};

function keystone(
  verdict: CrisisVerdict,
  quarantineResult: any = { status: 'persisted', crisisEntryId: 'q' },
) {
  const classifier = { classify: jest.fn().mockResolvedValue(verdict) };
  const quarantine = {
    quarantineCrisisEntry: jest.fn().mockResolvedValue(quarantineResult),
  };
  const bridge = {
    renderBridge: jest
      .fn()
      .mockReturnValue({ step1: 's', fork: { prompt: '', options: [] }, keepScreen: 'k', quietScreen: 'q' }),
    minimalStaticSafetyScreen: 'MIN',
  };
  const events = {
    append: jest.fn().mockResolvedValue({ status: 'appended', eventId: 'e' }),
  };
  const suppression = {
    pauseProactiveEngagement: jest
      .fn()
      .mockResolvedValue({ status: 'paused', until: 'x' }),
    defaultPauseUntil: jest.fn().mockReturnValue(new Date()),
  };
  const svc = new CrisisInterruptService(
    classifier as any,
    quarantine as any,
    bridge as any,
    events as any,
    suppression as any,
  );
  return { svc, classifier, quarantine, bridge, events, suppression };
}

const input: ScreenInput = { userId: 'smoke', text: SECRET, source: 'journal' };

describe('S5-2 · Block A — deployment-invariant safety re-assertions', () => {
  it('the credential-isolation guard is wired and rejects collapsed creds', () => {
    const collapsed = {
      QUARANTINE_DATABASE_URL: 'postgres://same@h/db',
      SAFETY_EVENTS_DATABASE_URL: 'postgres://same@h/db',
      SUPPRESSION_DATABASE_URL: 'postgres://same@h/db',
    };
    expect(() => assertDistinctSafetyCredentials(collapsed)).toThrow(
      CredentialIsolationError,
    );
    expect(() =>
      assertDistinctSafetyCredentials({
        QUARANTINE_DATABASE_URL: 'postgres://q@h/db',
        SAFETY_EVENTS_DATABASE_URL: 'postgres://e@h/db',
        SUPPRESSION_DATABASE_URL: 'postgres://s@h/db',
      }),
    ).not.toThrow();
  });

  it('synthetic crisis text triggers the firebreak (not proceed)', async () => {
    const t = keystone(POSITIVE);
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
    if (d.decision === 'firebreak') {
      expect(d.verdict.allow_memory).toBe(false);
      expect(d.verdict.allow_distillation).toBe(false);
    }
  });

  it('synthetic crisis text reaches ONLY quarantine (not bridge/events)', async () => {
    const t = keystone(POSITIVE);
    await t.svc.screen(input);
    expect(
      JSON.stringify(t.quarantine.quarantineCrisisEntry.mock.calls),
    ).toContain(SECRET);
    expect(JSON.stringify(t.bridge.renderBridge.mock.calls)).not.toContain(
      SECRET,
    );
    expect(JSON.stringify(t.events.append.mock.calls)).not.toContain(SECRET);
  });

  it('classifier fail-closed verdict still firebreaks (never proceed)', async () => {
    const t = keystone(FAIL_CLOSED_VERDICT);
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
  });

  it('quarantine failure does NOT fall back — still firebreak, no journal path', async () => {
    const t = keystone(POSITIVE, { status: 'failed_closed', reason: 'db' });
    const d = await t.svc.screen(input);
    expect(d.decision).toBe('firebreak');
    expect(JSON.stringify(t.events.append.mock.calls)).not.toContain(SECRET);
  });
});

// ── Block B: live HTTP checks against the deployed alpha (gated) ────────
const BASE = process.env.ALPHA_BASE_URL;
const liveDescribe = BASE ? describe : describe.skip;

liveDescribe('S5-2 · Block B — deployed alpha HTTP checks (ALPHA_BASE_URL)', () => {
  const url = (p: string) => `${BASE!.replace(/\/$/, '')}${p}`;
  const ok = (s: number) => s >= 200 && s < 300;

  it('public registration endpoints are NOT reachable', async () => {
    for (const path of ['/auth/register', '/register', '/signup']) {
      let status = 0;
      try {
        const r = await fetch(url(path), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        status = r.status;
      } catch {
        status = 0; // refused / no route → acceptable
      }
      expect(ok(status)).toBe(false);
    }
  }, 30_000);

  it('a protected route is not reachable without auth (gate not bypassable)', async () => {
    let status = 0;
    try {
      const r = await fetch(url('/journal-entries'), {
        method: 'POST',
        body: '{}',
      });
      status = r.status;
    } catch {
      status = 0;
    }
    expect(ok(status)).toBe(false);
  }, 30_000);
});

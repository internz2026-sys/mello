/**
 * 4C — Adversarial classifier corpus + regression suite.
 *
 * Three blocks:
 *  1. INTEGRITY (always): the corpus itself is a checked artifact — schema,
 *     unique ids, and the firebreak invariant (non-none ⇒ interrupt) hold
 *     for every expected label. A corrupt corpus cannot silently pass.
 *  2. FIREBREAK WIRING (always, deterministic): every corpus label, turned
 *     into the verdict it represents, is run through the keystone. Positives
 *     MUST firebreak with the normal pipeline NOT run (no crisis sample
 *     reaches journal/distiller/memory); negatives proceed. No model call.
 *  3. LIVE CLASSIFIER (opt-in, RUN_LIVE_CLASSIFIER=1): the real
 *     `claude -p` classifier is run against every sample. This is the
 *     regression gate that a future prompt/model edit cannot weaken
 *     silently. Skipped in normal CI (needs the CLI + auth + minutes).
 *
 * NOT clinical calibration (that is 4D). The corpus expectations are frozen
 * downward-only: tighten, never relax to make a weaker classifier pass.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { z } from 'zod';

import {
  CrisisRiskSchema,
  enforceVerdictInvariants,
  type CrisisRisk,
  type CrisisVerdict,
} from '../../schemas';
import {
  CrisisInterruptService,
  type ScreenInput,
} from '../middleware/crisis-interrupt.middleware';

const CORPUS_PATH = path.join(__dirname, 'fixtures', 'crisis-corpus.json');

const SampleSchema = z
  .object({
    id: z.string().min(1),
    category: z.string().min(1),
    text: z.string().min(1),
    expect: z
      .object({
        risk: z.array(CrisisRiskSchema).min(1),
        interrupt: z.boolean(),
      })
      .strict(),
    tolerateFalsePositive: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict();
type Sample = z.infer<typeof SampleSchema>;

const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8')) as {
  samples: unknown[];
};
const samples: Sample[] = corpus.samples.map((s) => SampleSchema.parse(s));

const isPositive = (s: Sample) =>
  s.expect.interrupt === true && !s.expect.risk.includes('none');

// ───────────────────────── Block 1: integrity ─────────────────────────

describe('4C — corpus integrity (the corpus is a checked artifact)', () => {
  it('every sample parses against the strict schema', () => {
    expect(samples.length).toBeGreaterThanOrEqual(30);
  });

  it('sample ids are unique', () => {
    const ids = samples.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the firebreak invariant holds for every expected label', () => {
    for (const s of samples) {
      if (s.expect.risk.includes('none')) {
        // A negative may only expect exactly ['none'] + interrupt false.
        expect(s.expect.risk).toEqual(['none']);
        expect(s.expect.interrupt).toBe(false);
      } else {
        // Any positive risk must demand interrupt true (matches §4 / code).
        expect(s.expect.interrupt).toBe(true);
      }
    }
  });

  it('contains both true positives and true negatives (no degenerate corpus)', () => {
    const pos = samples.filter(isPositive).length;
    const neg = samples.filter((s) => s.expect.risk.includes('none')).length;
    expect(pos).toBeGreaterThanOrEqual(20);
    expect(neg).toBeGreaterThanOrEqual(7);
  });

  it('covers each crisis-risk family at least once', () => {
    const cats = new Set(samples.map((s) => s.category));
    for (const need of [
      'suicidal_ideation_direct',
      'passive_ideation',
      'oblique_poetic',
      'dark_humor_ambiguous',
      'self_harm',
      'abuse_disclosure',
      'severe_acute_distress',
      'true_negative',
    ]) {
      expect([...cats].some((c) => c.startsWith(need))).toBe(true);
    }
  });
});

// ──────────────── Block 2: firebreak wiring (deterministic) ────────────

/** Turn an expected label into the verdict it represents (first allowed
 *  risk; code-enforced invariants applied), so we test the keystone, not
 *  the model. */
function verdictFor(s: Sample): CrisisVerdict {
  const risk = s.expect.risk[0] as CrisisRisk;
  return enforceVerdictInvariants({
    risk,
    severity: risk === 'none' ? 'none' : 'high',
    interrupt: s.expect.interrupt,
    allow_distillation: risk === 'none',
    allow_memory: risk === 'none',
    resource_region: 'US',
    confidence: 0.9,
  });
}

function buildKeystone(verdict: CrisisVerdict) {
  const classifier = { classify: jest.fn().mockResolvedValue(verdict) };
  const quarantine = {
    quarantineCrisisEntry: jest
      .fn()
      .mockResolvedValue({ status: 'persisted', crisisEntryId: 'q' }),
  };
  const bridge = {
    renderBridge: jest.fn().mockReturnValue({
      step1: 's',
      fork: { prompt: '', options: [] },
      keepScreen: 'k',
      quietScreen: 'q',
    }),
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
  return { svc, quarantine };
}

describe('4C — every corpus label routes correctly through the firebreak', () => {
  it.each(samples.map((s) => [s.id, s] as const))(
    '%s → keystone honours the label (no crisis sample reaches memory)',
    async (_id, s) => {
      const { svc, quarantine } = buildKeystone(verdictFor(s));
      const input: ScreenInput = {
        userId: 'u',
        text: s.text,
        source: 'journal',
      };
      const d = await svc.screen(input);
      if (isPositive(s)) {
        expect(d.decision).toBe('firebreak');
        // raw text only ever offered to quarantine
        expect(
          JSON.stringify(quarantine.quarantineCrisisEntry.mock.calls),
        ).toContain(s.text);
        if (d.decision === 'firebreak') {
          expect(d.verdict.allow_distillation).toBe(false);
          expect(d.verdict.allow_memory).toBe(false);
        }
      } else {
        expect(d.decision).toBe('proceed');
        expect(quarantine.quarantineCrisisEntry).not.toHaveBeenCalled();
      }
    },
  );
});

// ─────────────── Block 3: live classifier (opt-in gate) ───────────────

const LIVE = process.env.RUN_LIVE_CLASSIFIER === '1';
const liveDescribe = LIVE ? describe : describe.skip;

liveDescribe('4C — LIVE classifier regression (RUN_LIVE_CLASSIFIER=1)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    CrisisClassifierService,
  } = require('../classifier/crisis-classifier.service');
  const svc = new CrisisClassifierService();

  type Row = {
    id: string;
    category: string;
    expectedRisk: string[];
    gotRisk: string;
    gotInterrupt: boolean;
    outcome: 'pass' | 'tolerated_fp' | 'FALSE_NEGATIVE' | 'wrong_risk' | 'FALSE_POSITIVE';
  };
  const rows: Row[] = [];

  it.each(samples.map((s) => [s.id, s] as const))(
    'live %s',
    async (_id, s) => {
      const v: CrisisVerdict = await svc.classify({
        text: s.text,
        resourceRegion: 'US',
      });
      let outcome: Row['outcome'] = 'pass';
      if (isPositive(s)) {
        // The unrecoverable failure: a positive read as none / no interrupt.
        if (v.risk === 'none' || v.interrupt !== true) {
          outcome = 'FALSE_NEGATIVE';
        } else if (!s.expect.risk.includes(v.risk)) {
          outcome = 'wrong_risk'; // interrupted, but mis-bucketed
        }
      } else {
        if (v.risk !== 'none' || v.interrupt !== false) {
          outcome = s.tolerateFalsePositive ? 'tolerated_fp' : 'FALSE_POSITIVE';
        }
      }
      rows.push({
        id: s.id,
        category: s.category,
        expectedRisk: s.expect.risk,
        gotRisk: v.risk,
        gotInterrupt: v.interrupt,
        outcome,
      });
      // HARD failures: any false negative on a positive sample, or an
      // untolerated false positive. wrong_risk is recorded, not hard-failed
      // (still interrupts → firebreak still fires; bucket precision is 4D).
      expect(outcome).not.toBe('FALSE_NEGATIVE');
      expect(outcome).not.toBe('FALSE_POSITIVE');
    },
    60_000,
  );

  afterAll(() => {
    const byOutcome = rows.reduce<Record<string, number>>((a, r) => {
      a[r.outcome] = (a[r.outcome] || 0) + 1;
      return a;
    }, {});
    const report = {
      ranAt: new Date().toISOString(),
      total: rows.length,
      byOutcome,
      rows,
    };
    const out = path.join(__dirname, 'fixtures', 'crisis-corpus.baseline.json');
    fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf-8');
    // eslint-disable-next-line no-console
    console.log('LIVE corpus baseline →', out, JSON.stringify(byOutcome));
  });
});

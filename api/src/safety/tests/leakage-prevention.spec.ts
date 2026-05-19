/**
 * 4B.7 — Leakage-Prevention Release Gate (safety-boundary.md v0.2 §12).
 *
 * NOT classifier accuracy (that is 4C). This proves STRUCTURAL isolation:
 * quarantined crisis text has no path into journal/chat persistence,
 * distillation, embeddings, Qdrant, semantic memory, Future Self, or
 * retrieval — by behaviour AND by construction.
 *
 * Two complementary guarantees:
 *  A. Behavioural — through the keystone, across every failure permutation,
 *     raw text reaches ONLY quarantine and the decision is never `proceed`
 *     unless risk === none. A positive control proves the "not called"
 *     assertions are not vacuous.
 *  B. Static import guard — the memory-engine modules contain zero
 *     references to quarantine / its DB URL / crisis raw-text paths. A
 *     future refactor literally cannot wire crisis text into memory without
 *     tripping this gate. This is what makes quarantine architectural
 *     rather than aspirational.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { FAIL_CLOSED_VERDICT, type CrisisVerdict } from '../../schemas';
import {
  CrisisInterruptService,
  type ScreenDecision,
  type ScreenInput,
} from '../middleware/crisis-interrupt.middleware';

const SECRET = 'QUARANTINE-ONLY-RAW-CRISIS-TEXT-7f3a91';

const NONE: CrisisVerdict = {
  risk: 'none',
  severity: 'none',
  interrupt: false,
  allow_distillation: true,
  allow_memory: true,
  resource_region: 'US',
  confidence: 0.95,
};
const POSITIVE: CrisisVerdict = {
  risk: 'self_harm',
  severity: 'high',
  interrupt: true,
  allow_distillation: false,
  allow_memory: false,
  resource_region: 'US',
  confidence: 0.85,
};

const screenInput: ScreenInput = {
  userId: 'u-leak',
  text: SECRET,
  source: 'journal',
};

/** A stand-in for everything downstream of the firebreak decision —
 *  journal/chat write, embeddings, distiller, memory, Future Self,
 *  retrieval. The integration contract (STEP 8) is: invoke ONLY on
 *  `proceed`. The positive-control test proves this spy can fire. */
function makeNormalPipeline() {
  return {
    journalWrite: jest.fn(),
    embed: jest.fn(),
    distill: jest.fn(),
    createMemory: jest.fn(),
    futureSelf: jest.fn(),
    retrieve: jest.fn(),
  };
}
function honorDecision(
  d: ScreenDecision,
  np: ReturnType<typeof makeNormalPipeline>,
) {
  if (d.decision === 'proceed') {
    np.journalWrite();
    np.embed();
    np.distill();
    np.createMemory();
    np.futureSelf();
    np.retrieve();
  }
}

function build(verdict: CrisisVerdict, overrides: Record<string, any> = {}) {
  const quarantineCrisisEntry = jest
    .fn()
    .mockResolvedValue({ status: 'persisted', crisisEntryId: 'q' });
  const renderBridge = jest
    .fn()
    .mockReturnValue({ step1: 's', fork: { prompt: '', options: [] }, keepScreen: 'k', quietScreen: 'q' });
  const append = jest.fn().mockResolvedValue({ status: 'appended', eventId: 'e' });
  const pauseProactiveEngagement = jest
    .fn()
    .mockResolvedValue({ status: 'paused', until: 'x' });
  const defaultPauseUntil = jest.fn().mockReturnValue(new Date());

  const classifier = { classify: jest.fn().mockResolvedValue(verdict) };
  const quarantine = { quarantineCrisisEntry, ...overrides.quarantine };
  const bridge = { renderBridge, minimalStaticSafetyScreen: 'MIN', ...overrides.bridge };
  const events = { append, ...overrides.events };
  const suppression = { pauseProactiveEngagement, defaultPauseUntil, ...overrides.suppression };

  const svc = new CrisisInterruptService(
    classifier as any,
    quarantine as any,
    bridge as any,
    events as any,
    suppression as any,
  );
  return { svc, classifier, quarantine, bridge, events, suppression };
}

/** No mock anywhere except quarantine may have received the raw secret. */
function assertSecretOnlyInQuarantine(t: ReturnType<typeof build>) {
  const qArgs = JSON.stringify(t.quarantine.quarantineCrisisEntry.mock.calls);
  expect(qArgs).toContain(SECRET);
  for (const other of [
    t.bridge.renderBridge,
    t.events.append,
    t.suppression.pauseProactiveEngagement,
    t.classifier.classify, // classify gets text by design, but not via these mock-arg leaks downstream
  ]) {
    // classify legitimately receives the text (it must read it to classify);
    // the leakage concern is everything AFTER detection. Skip classify.
  }
  expect(JSON.stringify(t.bridge.renderBridge.mock.calls)).not.toContain(SECRET);
  expect(JSON.stringify(t.events.append.mock.calls)).not.toContain(SECRET);
  expect(
    JSON.stringify(t.suppression.pauseProactiveEngagement.mock.calls),
  ).not.toContain(SECRET);
}

describe('4B.7 — A. Behavioural leakage prevention (keystone)', () => {
  it('positive control: risk=none → proceed → normal pipeline DOES run (assertions are not vacuous)', async () => {
    const t = build(NONE);
    const np = makeNormalPipeline();
    const d = await t.svc.screen(screenInput);
    honorDecision(d, np);
    expect(d.decision).toBe('proceed');
    expect(np.journalWrite).toHaveBeenCalled();
    expect(np.distill).toHaveBeenCalled();
    expect(np.createMemory).toHaveBeenCalled();
  });

  it('crisis verdict → firebreak; raw text only to quarantine; normal pipeline NOT run', async () => {
    const t = build(POSITIVE);
    const np = makeNormalPipeline();
    const d = await t.svc.screen(screenInput);
    honorDecision(d, np);
    expect(d.decision).toBe('firebreak');
    assertSecretOnlyInQuarantine(t);
    for (const fn of Object.values(np)) expect(fn).not.toHaveBeenCalled();
  });

  it('fail-closed verdict (classifier outage/malformed) → firebreak; no normal pipeline', async () => {
    const t = build(FAIL_CLOSED_VERDICT);
    const np = makeNormalPipeline();
    const d = await t.svc.screen(screenInput);
    honorDecision(d, np);
    expect(d.decision).toBe('firebreak');
    for (const fn of Object.values(np)) expect(fn).not.toHaveBeenCalled();
  });

  it('quarantine write failure → still firebreak; no fallback; no normal pipeline', async () => {
    const t = build(POSITIVE, {
      quarantine: {
        quarantineCrisisEntry: jest
          .fn()
          .mockResolvedValue({ status: 'failed_closed', reason: 'db' }),
      },
    });
    const np = makeNormalPipeline();
    const d = await t.svc.screen(screenInput);
    honorDecision(d, np);
    expect(d.decision).toBe('firebreak');
    // The secret was only ever offered to quarantine, even though it failed.
    expect(
      JSON.stringify(t.events.append.mock.calls),
    ).not.toContain(SECRET);
    for (const fn of Object.values(np)) expect(fn).not.toHaveBeenCalled();
  });

  it('bridge / safety_events / suppression failures never unlock proceed', async () => {
    for (const overrides of [
      { bridge: { renderBridge: jest.fn(() => { throw new Error('render'); }), minimalStaticSafetyScreen: 'MIN' } },
      { events: { append: jest.fn().mockResolvedValue({ status: 'append_failed', reason: 'a' }) } },
      {
        suppression: {
          pauseProactiveEngagement: jest.fn().mockResolvedValue({ status: 'failed', reason: 's' }),
          defaultPauseUntil: jest.fn().mockReturnValue(new Date()),
        },
      },
    ]) {
      const t = build(POSITIVE, overrides);
      const np = makeNormalPipeline();
      const d = await t.svc.screen(screenInput);
      honorDecision(d, np);
      expect(d.decision).toBe('firebreak');
      for (const fn of Object.values(np)) expect(fn).not.toHaveBeenCalled();
    }
  });
});

describe('4B.7 — B. Static import guard (architectural, not aspirational)', () => {
  const REPO = path.resolve(__dirname, '..', '..', '..', '..');

  /**
   * The §12 guard is GLOB-DERIVED, not a hand-picked allowlist (post-4B
   * leakage audit G1/G2/V2: an allowlist cannot see a NEW controller/module
   * that wires quarantine in). It sweeps the entire non-safety surface and
   * SELF-EXTENDS when files are added.
   *
   * Scanned roots → every file under them, recursively, of these extensions.
   * The safety domain and the shared schema contract are the ONLY places
   * allowed to name quarantine; everything else is the leak surface.
   */
  const SCAN_ROOTS: Array<{ dir: string; exts: string[] }> = [
    { dir: path.join(REPO, 'api', 'src'), exts: ['.ts'] },
    { dir: path.join(REPO, 'distiller'), exts: ['.py'] },
    { dir: path.join(REPO, 'retriever'), exts: ['.py'] },
    { dir: path.join(REPO, 'apps'), exts: ['.ts', '.tsx'] },
  ];

  const SKIP_DIRS = new Set([
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.venv',
    'venv',
  ]);

  /** Allowed to name quarantine BY DESIGN. Three narrow, deliberate
   *  exemptions (same posture as the composition-root wiring exemption
   *  below — conscious + documented, never a blanket loosening):
   *   1. the safety domain itself owns the crisis tokens;
   *   2. the schema dir is the shared crisis-contract home (types only,
   *      no raw text, no DB credential);
   *   3. the S5-1 credential-isolation guard (and its spec) — these
   *      DEFEND the boundary: they reference the quarantine credential
   *      ENV-VAR NAME to *enforce* four-way isolation at boot. They
   *      import no safety module, hold no crisis row, and are not a data
   *      path to a quarantined entry. Naming the var to protect it is
   *      the opposite of leaking it.
   *  The planted-probe positive control still plants into a memory-engine
   *  dir, so this exemption cannot make the guard pass vacuously.
   *  Everything else is forbidden. */
  function isExempt(file: string): boolean {
    const p = file.split(path.sep).join('/');
    return (
      p.includes('/api/src/safety/') ||
      p.includes('/api/src/schemas/') ||
      p.endsWith('/api/src/common/credential-isolation.ts') ||
      p.endsWith('/api/src/common/credential-isolation.spec.ts')
    );
  }

  function collect(): string[] {
    const out: string[] = [];
    const walk = (dir: string, exts: string[]) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return; // a root may legitimately not exist (e.g. apps/ absent)
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (!SKIP_DIRS.has(e.name)) walk(full, exts);
        } else if (exts.some((x) => e.name.endsWith(x))) {
          if (!e.name.endsWith('.d.ts')) out.push(full);
        }
      }
    };
    for (const { dir, exts } of SCAN_ROOTS) walk(dir, exts);
    return out;
  }

  /** Forbidden anywhere on the non-safety surface. 'quarantine' subsumes
   *  QuarantineService / quarantine.service / quarantine/ / the
   *  quarantine.crisis_entries table. 'safety.module' is the barrel-bypass
   *  the audit called out (importing CrisisInterruptService via the module
   *  re-export to dodge a path-based check). */
  const FORBIDDEN = [
    'quarantine',
    'crisis_entries',
    'quarantine_database_url',
    'crisis-interrupt',
    'crisis-classifier',
    'crisisinterruptservice',
    'safety.module',
    'safety/middleware',
  ];

  /** The NestJS composition root MUST import SafetyModule to wire the
   *  firebreak into the app — that is how the firebreak exists at all. It is
   *  exempt for the two MODULE-WIRING tokens ONLY; it is still fully scanned
   *  for every crisis-DATA token (quarantine / crisis_entries / the
   *  credential / the service identifiers). DI registration is not a leak;
   *  reaching a crisis row would be. */
  const WIRING_TOKENS = new Set(['safety.module', 'safety/middleware']);
  function isCompositionRoot(file: string): boolean {
    return file.split(path.sep).join('/').endsWith('/api/src/app.module.ts');
  }

  function scanFor(files: string[]): Array<{ file: string; token: string }> {
    const hits: Array<{ file: string; token: string }> = [];
    for (const f of files) {
      if (isExempt(f)) continue;
      const root = isCompositionRoot(f);
      const src = fs.readFileSync(f, 'utf-8').toLowerCase();
      for (const token of FORBIDDEN) {
        if (root && WIRING_TOKENS.has(token)) continue; // DI wiring only
        if (src.includes(token)) hits.push({ file: f, token });
      }
    }
    return hits;
  }

  it('the scan surface is non-trivial and includes the known memory-engine files (anti-vacuity #1)', () => {
    const files = collect();
    // An empty/broken glob would let every assertion below pass vacuously.
    expect(files.length).toBeGreaterThanOrEqual(8);
    const rel = files.map((f) => f.split(path.sep).join('/'));
    for (const must of [
      '/distiller/distiller.py',
      '/retriever/retriever.py',
      '/retriever/embeddings.py',
      '/api/src/reflection/reflection.service.ts',
    ]) {
      expect(rel.some((r) => r.endsWith(must))).toBe(true);
    }
  });

  it('a PLANTED forbidden import IS detected (anti-vacuity #2 — positive control)', () => {
    // Prove the scanner is not green merely because nothing matches: drop a
    // probe that imports QuarantineService into a non-safety dir, assert the
    // scan flags it, then always remove it.
    const probe = path.join(REPO, 'api', 'src', 'memory', '__leakguard_probe__.ts');
    try {
      fs.writeFileSync(
        probe,
        "import { QuarantineService } from '../safety/quarantine/quarantine.service';\nexport const _ = QuarantineService;\n",
        'utf-8',
      );
      const hits = scanFor(collect());
      expect(hits.some((h) => h.file === probe && h.token === 'quarantine')).toBe(
        true,
      );
    } finally {
      if (fs.existsSync(probe)) fs.unlinkSync(probe);
    }
  });

  it('no non-safety file references quarantine / its credential / crisis store / the barrel bypass', () => {
    const hits = scanFor(collect());
    // Surface the actual offenders, not just a boolean.
    expect(
      hits.map((h) => `${h.file.split(path.sep).join('/')} :: ${h.token}`),
    ).toEqual([]);
  });

  it('the crisis raw-text payload type is not importable from any non-safety code', () => {
    for (const f of collect()) {
      if (isExempt(f) || !f.endsWith('.ts')) continue;
      const src = fs.readFileSync(f, 'utf-8');
      expect(src).not.toMatch(/from ['"].*safety\/quarantine/);
      expect(src).not.toMatch(/from ['"].*quarantine\.types/);
    }
  });
});

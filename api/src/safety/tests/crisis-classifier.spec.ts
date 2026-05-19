/**
 * 4B-H / B1 — Real classifier failure-branch coverage.
 *
 * The keystone/leakage suites inject FAIL_CLOSED_VERDICT synthetically; the
 * post-4B coverage audit flagged that NOTHING exercised the classifier
 * actually PRODUCING one. This drives the real CrisisClassifierService with
 * node:child_process mocked, so every fail-closed branch (spawn error,
 * non-zero exit, timeout, unparseable envelope, schema reject) is executed
 * for real — plus the §4 invariant coercion and region normalization, and a
 * B3 regression: no log line may ever contain the raw input text.
 */
import { EventEmitter } from 'node:events';

import { Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';

import { FAIL_CLOSED_VERDICT, type CrisisVerdict } from '../../schemas';
import { CrisisClassifierService } from '../classifier/crisis-classifier.service';

jest.mock('node:child_process', () => ({ spawn: jest.fn() }));
const spawnMock = spawn as unknown as jest.Mock;

/** A fake ChildProcess: EventEmitter + stream EmitterS + recording stdin. */
function makeChild() {
  const child = new EventEmitter() as any;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { write: jest.fn(), end: jest.fn() };
  child.kill = jest.fn();
  return child as {
    emit: EventEmitter['emit'];
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: jest.Mock; end: jest.Mock };
    kill: jest.Mock;
  };
}

const GOOD: CrisisVerdict = {
  risk: 'none',
  severity: 'none',
  interrupt: false,
  allow_distillation: true,
  allow_memory: true,
  resource_region: 'US',
  confidence: 0.95,
};

/** Wrap a verdict object as the `claude -p --output-format json` envelope. */
function envelope(resultObj: unknown, fenced = false) {
  const inner = JSON.stringify(resultObj);
  return JSON.stringify({
    is_error: false,
    result: fenced ? '```json\n' + inner + '\n```' : inner,
  });
}

const SECRET = 'RAW-CRISIS-TEXT-NEVER-IN-A-LOG-9c1d';

/** Construct fresh — the service reads timeout/model/cli from env in its
 *  field initializers at construction time, so setting process.env before
 *  this call is sufficient (no module re-require needed). */
function freshService() {
  return new CrisisClassifierService();
}

describe('CrisisClassifierService — real failure branches (4B-H / B1)', () => {
  let logSpy: jest.SpyInstance;
  let dbgSpy: jest.SpyInstance;

  beforeEach(() => {
    spawnMock.mockReset();
    logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    dbgSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  /** Every log/debug arg, flattened, for the B3 no-leak assertion. */
  const allLogText = () =>
    [...logSpy.mock.calls, ...dbgSpy.mock.calls]
      .flat()
      .map((x) => String(x))
      .join(' || ');

  it('spawn ENOENT (claude CLI missing) → FAIL_CLOSED_VERDICT', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    const err: NodeJS.ErrnoException = new Error('spawn claude ENOENT');
    err.code = 'ENOENT';
    child.emit('error', err);
    const v = await p;
    expect(v.risk).toBe('severe_acute_distress');
    expect(v).toMatchObject({
      interrupt: true,
      allow_distillation: false,
      allow_memory: false,
    });
    expect(v.resource_region).toBe('US');
    expect(allLogText()).not.toContain(SECRET);
    expect(allLogText()).toContain('classifier_subprocess_failed');
  });

  it('non-zero exit → FAIL_CLOSED_VERDICT; stdout/stderr never logged', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    child.stderr.emit('data', `traceback containing ${SECRET}`);
    child.stdout.emit('data', `echoed prompt ${SECRET}`);
    child.emit('close', 1);
    const v = await p;
    expect(v).toMatchObject(FAIL_CLOSED_VERDICT_SHAPE);
    // B3: the raw text appeared on BOTH streams; it must reach NO log line.
    expect(allLogText()).not.toContain(SECRET);
  });

  it('timeout → child SIGKILLed + FAIL_CLOSED_VERDICT', async () => {
    jest.useFakeTimers();
    process.env.MELLO_CLASSIFIER_TIMEOUT_MS = '5000';
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'UK' });
    jest.advanceTimersByTime(5001);
    const v = await p;
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
    expect(v).toMatchObject(FAIL_CLOSED_VERDICT_SHAPE);
    expect(v.resource_region).toBe('UK');
    expect(allLogText()).toContain('classifier_timeout');
    expect(allLogText()).not.toContain(SECRET);
    delete process.env.MELLO_CLASSIFIER_TIMEOUT_MS;
  });

  it('unparseable envelope (not JSON) → FAIL_CLOSED_VERDICT', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    child.stdout.emit('data', 'this is not json at all');
    child.emit('close', 0);
    const v = await p;
    expect(v).toMatchObject(FAIL_CLOSED_VERDICT_SHAPE);
    expect(allLogText()).toContain('classifier_output_unparseable');
    expect(allLogText()).not.toContain(SECRET);
  });

  it('envelope is_error / non-string result → FAIL_CLOSED_VERDICT', async () => {
    for (const env of [
      JSON.stringify({ is_error: true, result: 'x' }),
      JSON.stringify({ is_error: false, result: 42 }),
      JSON.stringify({ is_error: false }),
    ]) {
      const child = makeChild();
      spawnMock.mockReturnValue(child);
      const svc = freshService();
      const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
      child.stdout.emit('data', env);
      child.emit('close', 0);
      const v = await p;
      expect(v.risk).toBe('severe_acute_distress');
    }
  });

  it('valid envelope but schema-rejected verdict → FAIL_CLOSED_VERDICT', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    // Wrong enum + extra key under .strict() — both schema violations.
    child.stdout.emit(
      'data',
      envelope({ risk: 'banana', severity: 'high', wat: 1 }),
    );
    child.emit('close', 0);
    const v = await p;
    expect(v).toMatchObject(FAIL_CLOSED_VERDICT_SHAPE);
    expect(allLogText()).toContain('classifier_schema_rejected');
  });

  it('markdown-fenced JSON is still parsed (positive control)', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    child.stdout.emit('data', envelope(GOOD, /* fenced */ true));
    child.emit('close', 0);
    const v = await p;
    expect(v.risk).toBe('none');
    expect(v.resource_region).toBe('US');
  });

  it('risk=none passes through WITHOUT a false firebreak (invariant only fires on positive risk)', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: 'ordinary entry', resourceRegion: 'US' });
    child.stdout.emit(
      'data',
      envelope({ ...GOOD, severity: 'high', allow_memory: true }),
    );
    child.emit('close', 0);
    const v = await p;
    expect(v.risk).toBe('none');
    expect(v.allow_memory).toBe(true); // none → not coerced
  });

  it('positive risk: model booleans are OVERRIDDEN by §4 invariants', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    // Model lies: says it is safe to proceed on a suicidal-ideation verdict.
    child.stdout.emit(
      'data',
      envelope({
        risk: 'suicidal_ideation',
        severity: 'low',
        interrupt: false,
        allow_distillation: true,
        allow_memory: true,
        resource_region: 'US',
        confidence: 0.4,
      }),
    );
    child.emit('close', 0);
    const v = await p;
    expect(v.risk).toBe('suicidal_ideation');
    expect(v.interrupt).toBe(true);
    expect(v.allow_distillation).toBe(false);
    expect(v.allow_memory).toBe(false);
  });

  it('severe_acute_distress (uncategorized-acute catch-all) is honored + firebroken', async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);
    const svc = freshService();
    const p = svc.classify({ text: SECRET, resourceRegion: 'US' });
    child.stdout.emit(
      'data',
      envelope({
        risk: 'severe_acute_distress',
        severity: 'medium',
        interrupt: false,
        allow_distillation: true,
        allow_memory: true,
        resource_region: 'US',
        confidence: 0.6,
      }),
    );
    child.emit('close', 0);
    const v = await p;
    expect(v.risk).toBe('severe_acute_distress');
    expect(v).toMatchObject({
      interrupt: true,
      allow_distillation: false,
      allow_memory: false,
    });
  });

  it('region normalization: trims hint, falls back to verdict region when hint absent', async () => {
    // (a) padded hint → trimmed, wins over model
    {
      const child = makeChild();
      spawnMock.mockReturnValue(child);
      const svc = freshService();
      const p = svc.classify({ text: 'x', resourceRegion: '  US  ' });
      child.stdout.emit('data', envelope({ ...GOOD, resource_region: 'XX' }));
      child.emit('close', 0);
      expect((await p).resource_region).toBe('US');
    }
    // (b) no hint → model-provided region is used
    {
      const child = makeChild();
      spawnMock.mockReturnValue(child);
      const svc = freshService();
      const p = svc.classify({ text: 'x' });
      child.stdout.emit('data', envelope({ ...GOOD, resource_region: 'UK' }));
      child.emit('close', 0);
      expect((await p).resource_region).toBe('UK');
    }
    // (c) empty-string hint → treated as absent, model region used
    {
      const child = makeChild();
      spawnMock.mockReturnValue(child);
      const svc = freshService();
      const p = svc.classify({ text: 'x', resourceRegion: '   ' });
      child.stdout.emit('data', envelope({ ...GOOD, resource_region: 'UK' }));
      child.emit('close', 0);
      expect((await p).resource_region).toBe('UK');
    }
  });
});

/** FAIL_CLOSED minus the region (region is request-normalized, asserted
 *  separately where it matters). */
const FAIL_CLOSED_VERDICT_SHAPE = {
  risk: FAIL_CLOSED_VERDICT.risk,
  severity: FAIL_CLOSED_VERDICT.severity,
  interrupt: true,
  allow_distillation: false,
  allow_memory: false,
  confidence: 0,
};

import * as fs from 'node:fs';
import * as path from 'node:path';

import { CrisisBridgeRenderer } from '../bridge/crisis-bridge.service';

describe('CrisisBridgeRenderer (4B.4)', () => {
  const r = new CrisisBridgeRenderer();

  it('fills a verified region line and leaves no unfilled slot', () => {
    const b = r.renderBridge('US');
    expect(b.step1).toContain('988');
    expect(b.step1).not.toContain('{resource}');
    expect(b.keepScreen).not.toContain('{resource}');
    expect(b.fork.options.map((o) => o.id)).toEqual(['keep', 'quiet']);
  });

  it('falls back to a jurisdiction-neutral line (no number) for unknown region', () => {
    for (const region of [undefined, 'UNKNOWN', 'XX', '']) {
      const b = r.renderBridge(region as string | undefined);
      expect(b.step1).toContain('crisis line near you');
      expect(b.step1).not.toMatch(/\b988\b|\b116 123\b/);
      expect(b.step1).not.toContain('{resource}');
    }
  });

  it('is deterministic — same input yields byte-identical output', () => {
    expect(JSON.stringify(r.renderBridge('US'))).toEqual(
      JSON.stringify(r.renderBridge('US')),
    );
    expect(JSON.stringify(r.renderBridge())).toEqual(
      JSON.stringify(new CrisisBridgeRenderer().renderBridge()),
    );
  });

  it('contains no companion / presence language and no exclamation points', () => {
    const b = r.renderBridge('US');
    const all = [
      b.step1,
      b.fork.prompt,
      b.keepScreen,
      b.quietScreen,
      r.renderHolding('US').holding,
      r.minimalStaticSafetyScreen,
    ].join('\n');
    const lower = all.toLowerCase();
    for (const presence of [
      "i'm here",
      'i am here',
      'stay with you',
      "i'll be here",
      'here for you',
      'i am with you',
      'i will stay',
    ]) {
      expect(lower).not.toContain(presence);
    }
    expect(all).not.toContain('!');
  });

  it('the bridge module cannot call a model or storage (no such imports in code)', () => {
    const dir = path.join(__dirname, '..', 'bridge');
    const code = ['crisis-bridge.service.ts', 'crisis-bridge.templates.ts', 'crisis-resources.ts']
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf-8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    for (const forbidden of [
      'child_process',
      'classifier',
      '@anthropic-ai/sdk',
      "from 'pg'",
      'spawn(',
      '../quarantine',
    ]) {
      expect(code).not.toContain(forbidden);
    }
  });
});

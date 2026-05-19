import { Injectable } from '@nestjs/common';

import {
  BRIDGE_FORK_PROMPT,
  BRIDGE_HOLDING_MESSAGE,
  BRIDGE_KEEP_SCREEN,
  BRIDGE_OPTION_KEEP,
  BRIDGE_OPTION_QUIET,
  BRIDGE_QUIET_SCREEN,
  BRIDGE_STEP1,
  MINIMAL_STATIC_SAFETY_SCREEN,
} from './crisis-bridge.templates';
import { resolveResourceLine } from './crisis-resources';

export interface CrisisBridge {
  step1: string;
  fork: {
    prompt: string;
    options: Array<{ id: 'keep' | 'quiet'; label: string }>;
  };
  keepScreen: string;
  quietScreen: string;
}

export interface HoldingScreen {
  holding: string;
}

/**
 * CrisisBridgeRenderer — 4B.4. PURE and DETERMINISTIC. No model, no
 * network, no DB. Same input → byte-identical output. The bridge wording
 * does not vary by risk/severity by design (safety-boundary.md v0.2 §8:
 * minimally authored, the same firebreak regardless of category). Only the
 * static resource line varies, by region.
 *
 * This module imports no classifier, no child_process, no pg, no Anthropic
 * SDK — it structurally cannot call a model or touch storage.
 */
@Injectable()
export class CrisisBridgeRenderer {
  /** The same scripted firebreak for every positive verdict. */
  renderBridge(region?: string): CrisisBridge {
    const resource = resolveResourceLine(region);
    return {
      step1: this.fill(BRIDGE_STEP1, resource),
      fork: {
        prompt: BRIDGE_FORK_PROMPT,
        options: [{ ...BRIDGE_OPTION_KEEP }, { ...BRIDGE_OPTION_QUIET }],
      },
      keepScreen: this.fill(BRIDGE_KEEP_SCREEN, resource),
      quietScreen: BRIDGE_QUIET_SCREEN,
    };
  }

  /** §7 holding message for a safety-critical dependency failure. */
  renderHolding(region?: string): HoldingScreen {
    return { holding: this.fill(BRIDGE_HOLDING_MESSAGE, resolveResourceLine(region)) };
  }

  /** §7 absolute last resort — never the normal product UI. */
  readonly minimalStaticSafetyScreen = MINIMAL_STATIC_SAFETY_SCREEN;

  private fill(tpl: string, resource: string): string {
    return tpl.split('{resource}').join(resource);
  }
}

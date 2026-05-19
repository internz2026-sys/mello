import { Injectable, Logger } from '@nestjs/common';

import type { CrisisVerdict } from '../../schemas';
import { CrisisClassifierService } from '../classifier/crisis-classifier.service';
import { QuarantineService } from '../quarantine/quarantine.service';
import { CrisisBridgeRenderer, type CrisisBridge } from '../bridge/crisis-bridge.service';
import { SafetyEventsAppendService } from '../events/safety-events.service';
import { ProactiveSuppressionService } from '../suppression/proactive-suppression.service';
import type {
  SafetyEventSource,
  SafetyResponseTaken,
} from '../events/safety-events.types';

export interface ScreenInput {
  userId: string;
  text: string;
  source: SafetyEventSource;
  sourceId?: string;
  resourceRegion?: string;
}

/**
 * The decision the rest of the system MUST honour.
 *
 * `proceed` is returned IFF the classifier verdict is `none`. In every
 * other case — any positive risk, AND every failure path (classifier
 * outage/malformed → FAIL_CLOSED_VERDICT, quarantine failure, suppression
 * failure, event failure) — the decision is `firebreak`. There is no code
 * path from a failure to `proceed`.
 *
 * On `firebreak` the caller MUST NOT distill, embed, write memory, or
 * resume normal flow. `verdict.allow_distillation` / `verdict.allow_memory`
 * are already forced false by enforceVerdictInvariants.
 */
export type ScreenDecision =
  | { decision: 'proceed'; verdict: CrisisVerdict }
  | {
      decision: 'firebreak';
      verdict: CrisisVerdict;
      bridge: CrisisBridge;
      quarantine: 'persisted' | 'failed_closed';
      suppression: 'paused' | 'failed';
      event: 'appended' | 'append_failed';
    };

/**
 * CrisisInterruptService — 4B.3, the firebreak interception point.
 *
 * Composes the four isolated components. EVERY journal entry and chat
 * message must pass through screen() BEFORE the distiller / memory /
 * normal persistence (safety-boundary.md v0.2 §2/§6). Wiring each write
 * path through this is a STEP 8 integration requirement; bypassing it
 * means crisis text flows — the tests assert the decision is correct, the
 * integration must assert it is *called*.
 *
 * Raw text reaches ONLY quarantine. It is never passed to the bridge
 * (region only) nor to safety_events (whose input type has no raw-text
 * field — leakage is type-impossible there).
 */
@Injectable()
export class CrisisInterruptService {
  private readonly log = new Logger(CrisisInterruptService.name);

  constructor(
    private readonly classifier: CrisisClassifierService,
    private readonly quarantine: QuarantineService,
    private readonly bridge: CrisisBridgeRenderer,
    private readonly events: SafetyEventsAppendService,
    private readonly suppression: ProactiveSuppressionService,
  ) {}

  async screen(input: ScreenInput): Promise<ScreenDecision> {
    // 1. Classify. Outage/malformed → FAIL_CLOSED_VERDICT (risk !== none),
    //    so the firebreak fires; classify() itself never throws.
    const verdict = await this.classifier.classify({
      text: input.text,
      resourceRegion: input.resourceRegion,
    });

    // 2. The ONLY proceed path.
    if (verdict.risk === 'none') {
      return { decision: 'proceed', verdict };
    }

    // 3. Firebreak. From here, decision is fixed; no failure flips it.

    // 3a. Quarantine the raw text (the only place raw text goes).
    const q = await this.quarantine.quarantineCrisisEntry({
      userId: input.userId,
      rawText: input.text,
      risk: verdict.risk,
      severity: verdict.severity,
      resourceRegion: verdict.resource_region,
      classifierConfidence: verdict.confidence,
    });
    const quarantine = q.status === 'persisted' ? 'persisted' : 'failed_closed';

    // 3b. Render the scripted bridge. Pure; if it somehow fails, fall to the
    //     minimal static safety screen — never to the normal product UI.
    let bridge: CrisisBridge;
    try {
      bridge = this.bridge.renderBridge(verdict.resource_region);
    } catch (e) {
      this.log.error(`bridge render failed → minimal static screen: ${String(e)}`);
      bridge = {
        step1: this.bridge.minimalStaticSafetyScreen,
        fork: { prompt: '', options: [] },
        keepScreen: this.bridge.minimalStaticSafetyScreen,
        quietScreen: this.bridge.minimalStaticSafetyScreen,
      };
    }

    // 3c. Cross-session proactive suppression (§6.5). Non-blocking.
    const s = await this.suppression.pauseProactiveEngagement(
      input.userId,
      this.suppression.defaultPauseUntil(),
    );
    const suppression = s.status === 'paused' ? 'paused' : 'failed';

    // 3d. Structured audit append. Non-blocking (§7). NO raw text — the
    //     SafetyEventInput type has no field for it.
    const responseTaken: SafetyResponseTaken =
      quarantine === 'failed_closed'
        ? 'firebreak:failed_closed'
        : 'firebreak:quarantined';
    const region = (verdict.resource_region || 'neutral').trim() || 'neutral';
    const ev = await this.events.append({
      userId: input.userId,
      signalType: verdict.risk,
      // Unknown/none severity on a positive risk → high (conservative).
      severity: verdict.severity === 'none' ? 'high' : verdict.severity,
      source: input.source,
      sourceId: input.sourceId,
      responseTaken,
      resourcesShown: [`region:${region}`],
      escalatedToHuman: false,
    });
    const event = ev.status === 'appended' ? 'appended' : 'append_failed';

    return {
      decision: 'firebreak',
      verdict,
      bridge,
      quarantine,
      suppression,
      event,
    };
  }
}

import { Injectable } from '@nestjs/common';

import type { ClassifySafetyInput, CrisisVerdict } from '../schemas';
import { CrisisClassifierService } from './classifier/crisis-classifier.service';

/**
 * SafetyService — the runtime firebreak entry point (safety-boundary.md v0.2).
 *
 * STATE OF BUILD: 4B.1 landed. `classify()` is the REAL fail-closed
 * classifier (no longer the `{signal:null}` stub). The full firebreak
 * orchestration — quarantine write, scripted bridge, safety_events append,
 * proactive suppression, and the interrupt middleware that intercepts
 * journal/chat BEFORE normal flow — is wired in 4B.2–4B.6 by the same hand.
 *
 * IMPORTANT: a verdict from classify() does NOT mean a crisis was handled.
 * Until the interrupt middleware (4B.3/4B.5) is in place, callers must not
 * route real user writes through normal flow on the strength of a verdict
 * alone. classify() is detection only.
 */
@Injectable()
export class SafetyService {
  constructor(private readonly classifier: CrisisClassifierService) {}

  async classify(input: ClassifySafetyInput): Promise<CrisisVerdict> {
    return this.classifier.classify({
      text: input.body,
      resourceRegion: input.resource_region,
    });
  }
}

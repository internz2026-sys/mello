import { Module } from '@nestjs/common';

import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { CrisisClassifierService } from './classifier/crisis-classifier.service';
import { QuarantineService } from './quarantine/quarantine.service';
import { CrisisBridgeRenderer } from './bridge/crisis-bridge.service';
import { SafetyEventsAppendService } from './events/safety-events.service';
import { ProactiveSuppressionService } from './suppression/proactive-suppression.service';
import { CrisisInterruptService } from './middleware/crisis-interrupt.middleware';

/**
 * SafetyModule — the firebreak. Components per safety-boundary.md §14:
 *   4B.1 classifier            ✅ CrisisClassifierService
 *   4B.2 quarantine write path ✅ QuarantineService
 *   4B.4 scripted bridge       ✅ CrisisBridgeRenderer
 *   4B.5 safety_events append  ✅ SafetyEventsAppendService
 *   4B.6 proactive suppression ✅ ProactiveSuppressionService
 *   4B.3 interrupt (keystone)  ✅ CrisisInterruptService
 *   4B.7 leakage tests          · pending (the §12 release gate)
 *
 * CrisisInterruptService.screen() is the single firebreak interception
 * point. Every journal/chat write path must route through it before
 * normal persistence — wiring those routes is STEP 8 integration.
 */
@Module({
  controllers: [SafetyController],
  providers: [
    SafetyService,
    CrisisClassifierService,
    QuarantineService,
    CrisisBridgeRenderer,
    SafetyEventsAppendService,
    ProactiveSuppressionService,
    CrisisInterruptService,
  ],
  exports: [
    SafetyService,
    CrisisClassifierService,
    QuarantineService,
    CrisisBridgeRenderer,
    SafetyEventsAppendService,
    ProactiveSuppressionService,
    CrisisInterruptService,
  ],
})
export class SafetyModule {}

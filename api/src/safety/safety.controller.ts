import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import {
  ClassifySafetyInputSchema,
  type ClassifySafetyInput,
  type CrisisVerdict,
} from '../schemas';
import { SafetyService } from './safety.service';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  /**
   * Detection only. Returns the structured crisis verdict. This endpoint
   * does NOT itself interrupt, quarantine, or render the bridge — that is
   * the interrupt middleware's job (4B.3/4B.5). Exposed for the middleware
   * and for the adversarial corpus harness (4C).
   */
  @Post('classify')
  @HttpCode(200)
  async classify(
    @Body(new ZodPipe(ClassifySafetyInputSchema)) body: ClassifySafetyInput,
  ): Promise<CrisisVerdict> {
    return this.safety.classify(body);
  }
}

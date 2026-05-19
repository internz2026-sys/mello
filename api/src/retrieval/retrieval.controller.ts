import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import type { RequestWithUser } from '../common/request-with-user';
import {
  RetrieveInputSchema,
  type RetrieveInput,
  type RetrieveResponse,
} from '../schemas';
import { RetrievalService } from './retrieval.service';

@Controller('retrieve')
export class RetrievalController {
  constructor(private readonly retrieval: RetrievalService) {}

  @Post()
  @HttpCode(200)
  async retrieve(
    @Req() req: RequestWithUser,
    @Body(new ZodPipe(RetrieveInputSchema)) body: RetrieveInput,
  ): Promise<RetrieveResponse> {
    return this.retrieval.retrieve(req.user.sub, body);
  }
}

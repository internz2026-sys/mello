import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import { notImplemented, type NotImplementedResponse } from '../common/not-implemented';
import type { RequestWithUser } from '../common/request-with-user';
import {
  CreateFutureLetterSchema,
  ListFutureLettersQuerySchema,
  type CreateFutureLetterInput,
  type FutureLetter,
  type FutureSelf,
  type ListFutureLettersQuery,
} from '../schemas';
import { FutureSelfService } from './future-self.service';

@Controller()
export class FutureSelfController {
  constructor(private readonly futureSelf: FutureSelfService) {}

  @Get('future-selves')
  @HttpCode(200)
  async listFutureSelves(@Req() _req: RequestWithUser): Promise<FutureSelf[]> {
    return [];
  }

  @Get('future-letters')
  @HttpCode(200)
  async listLetters(
    @Req() _req: RequestWithUser,
    @Query(new ZodPipe(ListFutureLettersQuerySchema)) _query: ListFutureLettersQuery,
  ): Promise<FutureLetter[]> {
    return [];
  }

  @Post('future-letters')
  @HttpCode(501)
  async createLetter(
    @Req() _req: RequestWithUser,
    @Body(new ZodPipe(CreateFutureLetterSchema)) _body: CreateFutureLetterInput,
  ): Promise<FutureLetter | NotImplementedResponse> {
    return notImplemented('POST /future-letters');
  }
}

import { Controller, Get, HttpCode, Query, Req } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import type { RequestWithUser } from '../common/request-with-user';
import { ListMemoriesQuerySchema, type ListMemoriesQuery, type Memory } from '../schemas';
import { MemoryService } from './memory.service';

@Controller('memories')
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  // GET /memories
  // Default policy: sealed memories are excluded unless ?include_sealed=true.
  // The taxonomy treats sealed as never-proactive; clients must opt in
  // explicitly (and the eventual UI gate may require a second confirmation).
  @Get()
  @HttpCode(200)
  async list(
    @Req() _req: RequestWithUser,
    @Query(new ZodPipe(ListMemoriesQuerySchema)) _query: ListMemoriesQuery,
  ): Promise<Memory[]> {
    return [];
  }
}

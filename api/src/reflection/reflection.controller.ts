import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import { notImplemented, type NotImplementedResponse } from '../common/not-implemented';
import type { RequestWithUser } from '../common/request-with-user';
import {
  CreateChatMessageSchema,
  CreateJournalEntrySchema,
  ListChatMessagesQuerySchema,
  ListJournalEntriesQuerySchema,
  type ChatMessage,
  type CreateChatMessageInput,
  type CreateJournalEntryInput,
  type JournalEntry,
  type ListChatMessagesQuery,
  type ListJournalEntriesQuery,
} from '../schemas';
import { ReflectionService } from './reflection.service';

@Controller()
export class ReflectionController {
  constructor(private readonly reflection: ReflectionService) {}

  // -- journal entries --

  @Post('journal-entries')
  @HttpCode(501)
  async createJournalEntry(
    @Req() _req: RequestWithUser,
    @Body(new ZodPipe(CreateJournalEntrySchema)) _body: CreateJournalEntryInput,
  ): Promise<JournalEntry | NotImplementedResponse> {
    return notImplemented('POST /journal-entries');
  }

  @Get('journal-entries')
  @HttpCode(200)
  async listJournalEntries(
    @Req() _req: RequestWithUser,
    @Query(new ZodPipe(ListJournalEntriesQuerySchema)) _query: ListJournalEntriesQuery,
  ): Promise<JournalEntry[]> {
    return [];
  }

  // -- chat messages --

  @Post('chat-messages')
  @HttpCode(501)
  async createChatMessage(
    @Req() _req: RequestWithUser,
    @Body(new ZodPipe(CreateChatMessageSchema)) _body: CreateChatMessageInput,
  ): Promise<ChatMessage | NotImplementedResponse> {
    return notImplemented('POST /chat-messages');
  }

  @Get('chat-messages')
  @HttpCode(200)
  async listChatMessages(
    @Req() _req: RequestWithUser,
    @Query(new ZodPipe(ListChatMessagesQuerySchema)) _query: ListChatMessagesQuery,
  ): Promise<ChatMessage[]> {
    return [];
  }
}

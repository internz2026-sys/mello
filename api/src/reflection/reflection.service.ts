import { Injectable } from '@nestjs/common';
import type {
  ChatMessage,
  CreateChatMessageInput,
  CreateJournalEntryInput,
  JournalEntry,
  ListChatMessagesQuery,
  ListJournalEntriesQuery,
} from '../schemas';

/**
 * Reflection covers both raw inputs: journal entries (long-form, private)
 * and chat messages (turn-by-turn with mellō). These are stored verbatim;
 * the Distiller produces the semantic memory layer separately.
 */
@Injectable()
export class ReflectionService {
  async createJournalEntry(
    _userId: string,
    _input: CreateJournalEntryInput,
  ): Promise<JournalEntry | null> {
    return null;
  }

  async listJournalEntries(
    _userId: string,
    _query: ListJournalEntriesQuery,
  ): Promise<JournalEntry[]> {
    return [];
  }

  async createChatMessage(
    _userId: string,
    _input: CreateChatMessageInput,
  ): Promise<ChatMessage | null> {
    return null;
  }

  async listChatMessages(
    _userId: string,
    _query: ListChatMessagesQuery,
  ): Promise<ChatMessage[]> {
    return [];
  }
}

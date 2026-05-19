import { Injectable } from '@nestjs/common';
import type { ListMemoriesQuery, Memory } from '../schemas';

/**
 * Memory is the distilled semantic layer — Qdrant-mirrored in Postgres.
 * Writes happen via the distiller pipeline, not the API; the API
 * primarily exposes reads + tombstones (later).
 */
@Injectable()
export class MemoryService {
  async list(_userId: string, _query: ListMemoriesQuery): Promise<Memory[]> {
    return [];
  }

  async getById(_userId: string, _id: string): Promise<Memory | null> {
    return null;
  }
}

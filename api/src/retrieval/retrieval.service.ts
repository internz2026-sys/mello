import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import type { RetrieveInput, RetrieveResponse, RetrievedMemory } from '../schemas';

/**
 * Phase 0 hack — shells out to the Python retriever prototype.
 *
 * The retriever owns Qdrant + Voyage. Reimplementing it in Node now would
 * fork the embedding pipeline. Instead we exec the existing script and
 * parse its JSON stdout. To be replaced with a TS Qdrant client + Voyage
 * HTTP call in Phase 1.5.
 *
 * Wiring (must match retriever/retriever.py CLI):
 *   python ../retriever/retriever.py \
 *     --user_id <uuid> \
 *     --query "<text>" \
 *     --k <n> \
 *     [--include-sealed] \
 *     --format json
 *
 * The retriever emits a bare JSON array of
 *   { id, score, components: { similarity, importance, recency }, payload: { ... } }
 * which we wrap into the RetrieveResponse envelope. The Phase 1 task is to
 * have retriever.py emit the envelope directly so this adapter goes away.
 */
@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  async retrieve(userId: string, input: RetrieveInput): Promise<RetrieveResponse> {
    const bin = process.env.RETRIEVER_PYTHON_BIN ?? 'python';
    const entrypoint = process.env.RETRIEVER_ENTRYPOINT ?? '../retriever/retriever.py';

    const args = [
      entrypoint,
      '--user_id',
      userId,
      '--query',
      input.query,
      '--k',
      String(input.top_k),
      '--format',
      'json',
    ];
    if (input.include_sealed) {
      args.push('--include-sealed');
    }

    const fallback = (): RetrieveResponse => ({
      query: input.query,
      results: [],
      retrieved_at: new Date().toISOString(),
    });

    return new Promise<RetrieveResponse>((resolve) => {
      const child = spawn(bin, args, {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let out = '';
      let err = '';
      child.stdout.on('data', (chunk: Buffer) => {
        out += chunk.toString('utf8');
      });
      child.stderr.on('data', (chunk: Buffer) => {
        err += chunk.toString('utf8');
      });

      child.on('error', (e) => {
        this.logger.warn(`retriever spawn failed: ${e.message}`);
        process.stderr.write(`[retriever] spawn error: ${e.message}\n`);
        resolve(fallback());
      });

      child.on('close', (code) => {
        if (code !== 0) {
          const tail = err.slice(0, 1000);
          this.logger.warn(`retriever exited ${code}: ${tail}`);
          if (err) process.stderr.write(`[retriever stderr] ${err}\n`);
          resolve(fallback());
          return;
        }
        try {
          const parsed = JSON.parse(out) as unknown;
          const results = this.adaptResults(parsed, userId);
          resolve({
            query: input.query,
            results,
            retrieved_at: new Date().toISOString(),
          });
        } catch (e) {
          this.logger.warn(`retriever stdout not JSON: ${(e as Error).message}`);
          process.stderr.write(`[retriever] parse error: ${(e as Error).message}\n`);
          resolve(fallback());
        }
      });
    });
  }

  /**
   * Map the retriever's bare-list output onto the RetrievedMemory shape the
   * API contract expects. Each retriever item looks like:
   *   { id: <qdrant_point_id>, score, components: {...}, payload: {...memory} }
   *
   * We flatten payload → Memory + tack on score and cosine_similarity. Fields
   * the payload doesn't carry (id, user_id) fall back to defaults so the
   * envelope round-trips cleanly through clients.
   *
   * Phase 1 follow-up: have retriever.py emit the envelope itself with full
   * Memory objects (including memories.id from Postgres, not just the Qdrant
   * point id), and drop this adapter.
   */
  private adaptResults(parsed: unknown, userId: string): RetrievedMemory[] {
    if (!Array.isArray(parsed)) {
      this.logger.warn('retriever stdout was not a JSON array; returning empty');
      return [];
    }

    const out: RetrievedMemory[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const payload = (item.payload as Record<string, unknown> | undefined) ?? {};
      const components = (item.components as Record<string, unknown> | undefined) ?? {};

      const memory: RetrievedMemory = {
        // The Qdrant point id is not the Postgres memories.id; if the
        // distiller starts writing the real Postgres uuid into the payload
        // we surface that, otherwise fall back to a random placeholder so
        // the schema validates. Phase 1 will surface memories.id properly.
        id: typeof payload.id === 'string' ? (payload.id as string) : randomUUID(),
        user_id: typeof payload.user_id === 'string' ? (payload.user_id as string) : userId,
        kind:
          typeof payload.kind === 'string' && payload.kind
            ? (payload.kind as RetrievedMemory['kind'])
            : 'identity',
        stability:
          typeof payload.stability === 'string' && payload.stability
            ? (payload.stability as RetrievedMemory['stability'])
            : 'evolving',
        sensitivity:
          typeof payload.sensitivity === 'string' && payload.sensitivity
            ? (payload.sensitivity as RetrievedMemory['sensitivity'])
            : 'normal',
        summary: typeof payload.summary === 'string' ? (payload.summary as string) : '',
        evidence: Array.isArray(payload.evidence) ? (payload.evidence as string[]) : [],
        emotions: Array.isArray(payload.emotions)
          ? (payload.emotions as RetrievedMemory['emotions'])
          : [],
        themes: Array.isArray(payload.themes) ? (payload.themes as string[]) : [],
        relationships: Array.isArray(payload.relationships)
          ? (payload.relationships as string[])
          : [],
        spiritual_themes: Array.isArray(payload.spiritual_themes)
          ? (payload.spiritual_themes as string[])
          : [],
        importance: typeof payload.importance === 'number' ? (payload.importance as number) : 0,
        identity_weight:
          typeof payload.identity_weight === 'number' ? (payload.identity_weight as number) : 0,
        first_observed_at:
          typeof payload.first_observed_at === 'string'
            ? (payload.first_observed_at as string)
            : new Date(0).toISOString(),
        last_reinforced_at:
          typeof payload.last_reinforced_at === 'string'
            ? (payload.last_reinforced_at as string)
            : new Date(0).toISOString(),
        vocab_version:
          typeof payload.vocab_version === 'string' ? (payload.vocab_version as string) : '0.2',
        score: typeof item.score === 'number' ? (item.score as number) : 0,
        cosine_similarity:
          typeof components.similarity === 'number' ? (components.similarity as number) : undefined,
      };
      out.push(memory);
    }
    return out;
  }

}

import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Thin Zod adapter for NestJS @Body / @Query / @Param decorators.
 *
 * Usage:
 *   foo(@Body(new ZodPipe(MySchema)) body: MyInput) { ... }
 *
 * Intentionally minimal — no global pipe registration, no class-validator.
 */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'validation_failed',
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}

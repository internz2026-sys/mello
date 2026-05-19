import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { assertDistinctSafetyCredentials } from './common/credential-isolation';

async function bootstrap(): Promise<void> {
  // S5-1 / AD-1: refuse to boot unless the four DB credentials are
  // isolated. Runs BEFORE any pool is constructed. Never prints a value.
  assertDistinctSafetyCredentials();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // Zod handles deep validation per-endpoint; this is just a global
  // safety net for accidental untyped DTOs.
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`mellō api listening on :${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});

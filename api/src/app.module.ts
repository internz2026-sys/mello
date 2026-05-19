import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthMiddleware } from './auth/supabase-auth.middleware';
import { ProfilesModule } from './profiles/profiles.module';
import { ReflectionModule } from './reflection/reflection.module';
import { MemoryModule } from './memory/memory.module';
import { FutureSelfModule } from './future-self/future-self.module';
import { SafetyModule } from './safety/safety.module';
import { RetrievalModule } from './retrieval/retrieval.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProfilesModule,
    ReflectionModule,
    MemoryModule,
    FutureSelfModule,
    SafetyModule,
    RetrievalModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply Supabase JWT verification to every domain route.
    // /healthz is explicitly excluded.
    consumer
      .apply(SupabaseAuthMiddleware)
      .exclude(
        { path: 'healthz', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

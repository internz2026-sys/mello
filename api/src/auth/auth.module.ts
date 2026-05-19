import { Module } from '@nestjs/common';
import { SupabaseAuthMiddleware } from './supabase-auth.middleware';

@Module({
  providers: [SupabaseAuthMiddleware],
  exports: [SupabaseAuthMiddleware],
})
export class AuthModule {}

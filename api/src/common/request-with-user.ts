import type { Request } from 'express';

/**
 * The authenticated user payload extracted from a Supabase JWT.
 * `sub` is the Supabase auth.users.id (UUID) and matches public.users.id.
 */
export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

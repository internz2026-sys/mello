import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import type { AuthenticatedUser, RequestWithUser } from '../common/request-with-user';

/**
 * Verifies Authorization: Bearer <jwt> against SUPABASE_JWT_SECRET (HS256).
 * On success attaches `req.user` ({ sub, email, role, aud }).
 *
 * Supabase JWTs are HS256-signed with the project's JWT secret by default,
 * which is what we validate here. For RS256 (custom JWKS) we'd swap to
 * a JWKS client — out of scope for Phase 0.
 */
@Injectable()
export class SupabaseAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SupabaseAuthMiddleware.name);

  use(req: RequestWithUser, _res: Response, next: NextFunction): void {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      // Misconfiguration — fail closed.
      throw new UnauthorizedException('auth_not_configured');
    }

    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('missing_bearer_token');
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('empty_bearer_token');
    }

    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string' || decoded === null) {
        throw new UnauthorizedException('invalid_token_payload');
      }
      const payload = decoded as Record<string, unknown>;
      const sub = payload.sub;
      if (typeof sub !== 'string') {
        throw new UnauthorizedException('invalid_token_payload');
      }

      const user: AuthenticatedUser = {
        sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
        aud: typeof payload.aud === 'string' ? payload.aud : undefined,
      };
      req.user = user;
      next();
    } catch (err) {
      this.logger.debug(`jwt verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException('invalid_token');
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { PatchProfileInput, Profile } from '../schemas';

@Injectable()
export class ProfilesService {
  /** Fetch the calling user's profile row, joined with `public.users`. */
  async getMine(_userId: string): Promise<Profile | null> {
    return null;
  }

  /** Patch the calling user's profile. Returns the updated row. */
  async patchMine(_userId: string, _patch: PatchProfileInput): Promise<Profile | null> {
    return null;
  }
}

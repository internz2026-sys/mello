import { Body, Controller, Get, HttpCode, Patch, Req } from '@nestjs/common';

import { ZodPipe } from '../common/zod-pipe';
import type { RequestWithUser } from '../common/request-with-user';
import { PatchProfileSchema, type PatchProfileInput, type Profile } from '../schemas';
import { notImplemented, type NotImplementedResponse } from '../common/not-implemented';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me')
  @HttpCode(501)
  async getMe(@Req() _req: RequestWithUser): Promise<Profile | NotImplementedResponse> {
    return notImplemented('GET /profiles/me');
  }

  @Patch('me')
  @HttpCode(501)
  async patchMe(
    @Req() _req: RequestWithUser,
    @Body(new ZodPipe(PatchProfileSchema)) _body: PatchProfileInput,
  ): Promise<Profile | NotImplementedResponse> {
    return notImplemented('PATCH /profiles/me');
  }
}

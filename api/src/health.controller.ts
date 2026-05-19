import { Controller, Get, HttpCode } from '@nestjs/common';

const VERSION = process.env.npm_package_version ?? '0.1.0';

@Controller()
export class HealthController {
  @Get('healthz')
  @HttpCode(200)
  healthz(): { status: 'ok'; version: string } {
    return { status: 'ok', version: VERSION };
  }
}

import { Module } from '@nestjs/common';
import { FutureSelfController } from './future-self.controller';
import { FutureSelfService } from './future-self.service';

@Module({
  controllers: [FutureSelfController],
  providers: [FutureSelfService],
  exports: [FutureSelfService],
})
export class FutureSelfModule {}

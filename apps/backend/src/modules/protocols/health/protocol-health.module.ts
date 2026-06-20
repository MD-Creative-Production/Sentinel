import { Module } from '@nestjs/common';
import { ProtocolHealthController } from './protocol-health.controller';
import { ProtocolHealthService } from './protocol-health.service';

@Module({
  controllers: [ProtocolHealthController],
  providers: [ProtocolHealthService],
  exports: [ProtocolHealthService],
})
export class ProtocolHealthModule {}

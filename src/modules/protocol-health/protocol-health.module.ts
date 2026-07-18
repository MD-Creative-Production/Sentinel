import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolHealth } from './entities';
import { ProtocolHealthController } from './protocol-health.controller';
import { ProtocolHealthService } from './protocol-health.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProtocolHealth])],
  controllers: [ProtocolHealthController],
  providers: [ProtocolHealthService],
})
export class ProtocolHealthModule {}
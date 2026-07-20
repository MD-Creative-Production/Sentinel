import { Module } from '@nestjs/common';
import { ProtocolHealthController } from './protocol-health.controller';
import { ProtocolHealthService } from './protocol-health.service';
import { ProtocolHealthRepository } from './repositories/protocol-health.repository';
import { ChainsModule } from '../../modules/chains/chains.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [ChainsModule, NotificationsModule, IncidentsModule],
  controllers: [ProtocolHealthController],
  providers: [ProtocolHealthService, ProtocolHealthRepository],
  exports: [ProtocolHealthService],
})
export class ProtocolHealthModule {}

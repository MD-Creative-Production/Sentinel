import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MultisigMonitoringService } from './multisig-monitoring.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [MultisigMonitoringService],
  exports: [MultisigMonitoringService],
})
export class MultisigMonitoringModule {}

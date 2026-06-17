import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../../../database/database.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { SpikeDetectionModule } from './modules/detection/contracts/spike-detection.module';

@Module({
  imports: [DatabaseModule, HealthModule, NotificationsModule, ReportingModule, SpikeDetectionModule],
  controllers: [AppController],
})
export class AppModule {}

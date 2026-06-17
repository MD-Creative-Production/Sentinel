import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../../../database/database.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { SecurityPostureModule } from './modules/security-posture/security-posture.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    NotificationsModule,
    ReportingModule,
    SecurityPostureModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

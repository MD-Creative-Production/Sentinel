import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../../../database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [DatabaseModule, AiModule, HealthModule, NotificationsModule, ReportingModule],
  controllers: [AppController],
})
export class AppModule {}

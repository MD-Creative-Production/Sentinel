import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { SchedulerService } from './scheduler.service';
import { EmailService } from './email.service';

@Module({
  providers: [ReportService, SchedulerService, EmailService],
  exports: [ReportService, SchedulerService],
})
export class ReportsModule {}

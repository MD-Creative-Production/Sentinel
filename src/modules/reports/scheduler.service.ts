import { Injectable, OnModuleInit } from '@nestjs/common';
import { ReportService } from './report.service';
import * as cron from 'node-cron';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(private readonly reportService: ReportService) {}

  onModuleInit() {
    // Daily at 08:00 UTC
    cron.schedule('0 8 * * *', async () => {
      const content = await this.reportService.generateDailyReport();
      await this.reportService.deliverReport(content, 'Daily Security Report');
    });

    // Weekly on Monday at 09:00 UTC
    cron.schedule('0 9 * * MON', async () => {
      const content = await this.reportService.generateWeeklyReport();
      await this.reportService.deliverReport(content, 'Weekly Security Report');
    });
  }
}

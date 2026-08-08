import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class ReportService {
  constructor(private readonly emailService: EmailService) {}

  async generateDailyReport(): Promise<string> {
    // TODO: aggregate daily monitoring data
    return 'Daily security summary placeholder';
  }

  async generateWeeklyReport(): Promise<string> {
    // TODO: aggregate weekly monitoring data
    return 'Weekly security summary placeholder';
  }

  async deliverReport(content: string, subject: string) {
    await this.emailService.sendReport(content, subject);
  }
}

import { Module } from '@nestjs/common';
import { ReportingModule } from '../../../apps/backend/src/modules/reporting/reporting.module';
import { ReportsController } from './reports.controller';
import { PdfReportService } from './pdf/pdf-report.service';

@Module({
  imports: [ReportingModule],
  controllers: [ReportsController],
  providers: [PdfReportService],
  exports: [PdfReportService],
})
export class ReportsModule {}

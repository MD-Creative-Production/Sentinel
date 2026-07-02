import {
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  ParseIntPipe,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ReportingService } from '../../../apps/backend/src/modules/reporting/reporting.service';
import { PdfReportService } from './pdf/pdf-report.service';

/**
 * PDF report export endpoints.
 *
 * GET /reports/security/pdf          — download report for the last 30 days (default)
 * GET /reports/security/pdf?days=7   — download report for a custom window
 */
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly pdfReportService: PdfReportService,
  ) {}

  @Get('security/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadSecurityReportPdf(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<StreamableFile> {
    const report = this.reportingService.getSecurityReport(days);
    const pdf = await this.pdfReportService.generateSecurityReport(report);
    const filename = `sentinel-security-report-${days}d.pdf`;

    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

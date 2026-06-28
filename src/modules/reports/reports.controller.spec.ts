import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { ReportingService } from '../../../apps/backend/src/modules/reporting/reporting.service';
import { SecurityReport } from '../../../apps/backend/src/modules/reporting/interfaces/reporting.interface';
import { ReportsController } from './reports.controller';
import { PdfReportService } from './pdf/pdf-report.service';

const mockReport: SecurityReport = {
  generatedAt: '2026-06-15T10:00:00.000Z',
  periodDays: 7,
  totalAlerts: 27,
  severityBreakdown: {
    low: 12,
    medium: 8,
    high: 5,
    critical: 2,
  },
  topChains: [{ chain: 'Ethereum', count: 11 }],
  resolvedAlerts: 20,
  unresolvedAlerts: 7,
  criticalUnresolved: 2,
};

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportingService: { getSecurityReport: jest.Mock };
  let pdfReportService: { generateSecurityReport: jest.Mock };

  beforeEach(async () => {
    reportingService = {
      getSecurityReport: jest.fn().mockReturnValue(mockReport),
    };
    pdfReportService = {
      generateSecurityReport: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportingService, useValue: reportingService },
        { provide: PdfReportService, useValue: pdfReportService },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadSecurityReportPdf', () => {
    it('returns a StreamableFile built from report data', async () => {
      const result = await controller.downloadSecurityReportPdf(7);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(reportingService.getSecurityReport).toHaveBeenCalledWith(7);
      expect(pdfReportService.generateSecurityReport).toHaveBeenCalledWith(mockReport);
    });
  });
});

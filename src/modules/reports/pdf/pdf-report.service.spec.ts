import 'reflect-metadata';
import { SecurityReport } from '../../../../apps/backend/src/modules/reporting/interfaces/reporting.interface';
import { PdfReportService } from './pdf-report.service';

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
  topChains: [
    { chain: 'Ethereum', count: 11 },
    { chain: 'Soroban', count: 9 },
  ],
  resolvedAlerts: 20,
  unresolvedAlerts: 7,
  criticalUnresolved: 2,
};

describe('PdfReportService', () => {
  let service: PdfReportService;

  beforeEach(() => {
    service = new PdfReportService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecurityReport', () => {
    it('returns a PDF buffer with a valid PDF header', async () => {
      const pdf = await service.generateSecurityReport(mockReport);

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(0);
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    });

    it('generates a larger buffer for reports with more chain data', async () => {
      const smallReport = { ...mockReport, topChains: [{ chain: 'Ethereum', count: 1 }] };
      const largeReport = {
        ...mockReport,
        topChains: [
          { chain: 'Ethereum', count: 11 },
          { chain: 'Soroban', count: 9 },
          { chain: 'Polygon', count: 7 },
          { chain: 'Stellar', count: 5 },
        ],
      };

      const smallPdf = await service.generateSecurityReport(smallReport);
      const largePdf = await service.generateSecurityReport(largeReport);

      expect(largePdf.length).toBeGreaterThanOrEqual(smallPdf.length);
    });
  });
});

import 'reflect-metadata';
import PDFDocument from 'pdfkit';
import { SecurityReport } from '../../../../apps/backend/src/modules/reporting/interfaces/reporting.interface';
import { renderSecurityReportPdfTemplate } from './pdf-report.template';

const mockReport: SecurityReport = {
  generatedAt: '2026-06-15T10:00:00.000Z',
  periodDays: 30,
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

describe('renderSecurityReportPdfTemplate', () => {
  it('renders without throwing', () => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    expect(() => {
      renderSecurityReportPdfTemplate(doc, mockReport);
      doc.end();
    }).not.toThrow();
  });
});

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { SecurityReport } from '../../../../apps/backend/src/modules/reporting/interfaces/reporting.interface';
import { renderSecurityReportPdfTemplate } from './pdf-report.template';

@Injectable()
export class PdfReportService {
  /**
   * Generates a downloadable PDF buffer for the given security report.
   */
  generateSecurityReport(report: SecurityReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      renderSecurityReportPdfTemplate(doc, report);
      doc.end();
    });
  }
}

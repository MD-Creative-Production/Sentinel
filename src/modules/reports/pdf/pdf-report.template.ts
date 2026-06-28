import PDFDocument from 'pdfkit';
import { SecurityReport } from '../../../../apps/backend/src/modules/reporting/interfaces/reporting.interface';

const BRAND_COLOR = '#8b5cf6';
const TEXT_MUTED = '#64748b';

type PdfDocumentInstance = InstanceType<typeof PDFDocument>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Renders a security findings report into a PDF document using the standard template.
 */
export function renderSecurityReportPdfTemplate(
  doc: PdfDocumentInstance,
  report: SecurityReport,
): void {
  doc
    .fontSize(22)
    .fillColor(BRAND_COLOR)
    .text('Sentinel Security Report', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor(TEXT_MUTED)
    .text(`Generated: ${formatDate(report.generatedAt)}`, { align: 'center' })
    .text(`Reporting period: last ${report.periodDays} days`, { align: 'center' })
    .moveDown(1.5);

  doc.fontSize(14).fillColor('#0f172a').text('Executive Summary');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#1e293b');
  doc.text(`Total alerts: ${report.totalAlerts}`);
  doc.text(`Resolved: ${report.resolvedAlerts}`);
  doc.text(`Unresolved: ${report.unresolvedAlerts}`);
  doc.text(`Critical unresolved: ${report.criticalUnresolved}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#0f172a').text('Severity Breakdown');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#1e293b');
  const { severityBreakdown } = report;
  doc.text(`Low: ${severityBreakdown.low}`);
  doc.text(`Medium: ${severityBreakdown.medium}`);
  doc.text(`High: ${severityBreakdown.high}`);
  doc.text(`Critical: ${severityBreakdown.critical}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#0f172a').text('Top Affected Chains');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#1e293b');
  report.topChains.forEach(({ chain, count }) => {
    doc.text(`${chain}: ${count} alert(s)`);
  });

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text('Sentinel — Security findings export', { align: 'center' });
}

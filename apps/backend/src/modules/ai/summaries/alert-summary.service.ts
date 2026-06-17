import { Injectable } from '@nestjs/common';

export interface AlertSummaryInput {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface AlertSummaryResult {
  summary: string;
  riskExplanation: string;
  recommendations: string[];
}

@Injectable()
export class AlertSummaryService {
  generateAlertSummary(input: AlertSummaryInput): AlertSummaryResult {
    const signature = this.getMetadataValue(input.metadata, 'signature');
    const contract = this.getMetadataValue(input.metadata, 'contract');
    const summary = this.buildSummary(input.title, input.message, signature, contract);
    const riskExplanation = this.buildRiskExplanation(input.severity, signature, contract);
    const recommendations = this.buildRecommendations(input.severity, signature);

    return {
      summary,
      riskExplanation,
      recommendations,
    };
  }

  private buildSummary(
    title: string,
    message: string,
    signature?: string,
    contract?: string,
  ): string {
    const signatureText = signature ? ` Pattern detected: ${signature}.` : '';
    const contractText = contract ? ` Contract ${contract} is involved.` : '';
    const ownershipTransferText =
      /ownership|transfer/i.test(message) || /ownership|transfer/i.test(title)
        ? ' This indicates an ownership transfer risk.'
        : '';
    return `${title}. ${message}${ownershipTransferText}${signatureText}${contractText}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildRiskExplanation(
    severity: AlertSummaryInput['severity'],
    signature?: string,
    contract?: string,
  ): string {
    const severityText = this.describeSeverity(severity);
    const signatureText = signature
      ? ` The ${signature} pattern suggests a potentially malicious transaction.`
      : '';
    const contractText = contract
      ? ` The activity involving ${contract} could lead to loss of control or fund movement if not contained.`
      : '';
    return `${severityText}${signatureText}${contractText}`.replace(/\s+/g, ' ').trim();
  }

  private buildRecommendations(
    severity: AlertSummaryInput['severity'],
    signature?: string,
  ): string[] {
    const base = [
      'Review the transaction details immediately and confirm whether the activity is expected.',
      'Verify the contract state and any recent admin or ownership changes before taking further action.',
    ];

    if (severity === 'high' || severity === 'critical') {
      base.push('Pause or restrict contract interactions if the risk is confirmed.');
      base.push('Escalate to the on-call operator and prepare an incident response checklist.');
    }

    if (signature) {
      base.push(
        `Investigate the ${signature} behavior specifically and compare it against known safe patterns.`,
      );
    }

    return base;
  }

  private describeSeverity(severity: AlertSummaryInput['severity']): string {
    switch (severity) {
      case 'critical':
        return 'This is a critical alert because the activity may immediately expose assets to compromise.';
      case 'high':
        return 'This is a high-risk alert because the activity could affect contract safety or user funds.';
      case 'medium':
        return 'This is a medium-risk alert because the activity warrants closer review.';
      default:
        return 'This is a low-risk alert because the activity appears limited and should still be checked.';
    }
  }

  private getMetadataValue(
    metadata: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    if (!metadata) {
      return undefined;
    }

    const value = metadata[key];
    return typeof value === 'string' ? value : undefined;
  }
}

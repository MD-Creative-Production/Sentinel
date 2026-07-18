import { AlertSeverity } from '../enums';
import { PolicyViolationEntity } from '../entities/policy-violation.entity';

export interface AlertData {
  policyName: string;
  walletAddress: string;
  chainId: number;
  transactionHash: string;
  violatedRule: string;
  thresholdValue: string;
  observedValue: string;
  severity: AlertSeverity;
  recommendedAction?: string;
  contextData?: Record<string, unknown>;
  recipientAddress?: string;
  transactionAmount?: string;
}

export function generateAlertForViolation(violation: PolicyViolationEntity): AlertData {
  return {
    policyName: violation.policyName,
    walletAddress: violation.walletAddress,
    chainId: violation.chainId,
    transactionHash: violation.transactionHash,
    violatedRule: violation.violatedRule,
    thresholdValue: violation.thresholdValue,
    observedValue: violation.observedValue,
    severity: violation.severity as AlertSeverity,
    recommendedAction: violation.recommendedAction || undefined,
    contextData: violation.contextData || undefined,
    recipientAddress: violation.recipientAddress || undefined,
    transactionAmount: violation.transactionAmount || undefined,
  };
}

export function formatAlertMessage(alert: AlertData): string {
  const severityEmoji = getSeverityEmoji(alert.severity);
  const title = `${severityEmoji} Treasury Policy Violation: ${alert.policyName}`;
  
  const details = [
    `Wallet: ${alert.walletAddress}`,
    `Chain: ${alert.chainId}`,
    `Transaction: ${alert.transactionHash}`,
    `Violated Rule: ${alert.violatedRule}`,
    `Threshold: ${alert.thresholdValue}`,
    `Observed: ${alert.observedValue}`,
  ];

  if (alert.recipientAddress) {
    details.push(`Recipient: ${alert.recipientAddress}`);
  }

  if (alert.transactionAmount) {
    details.push(`Amount: ${alert.transactionAmount}`);
  }

  if (alert.recommendedAction) {
    details.push(`Recommended Action: ${alert.recommendedAction}`);
  }

  return `${title}\n${details.join('\n')}`;
}

export function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.Critical:
      return '🚨';
    case AlertSeverity.High:
      return '⚠️';
    case AlertSeverity.Medium:
      return '🔶';
    case AlertSeverity.Low:
      return '🔵';
    case AlertSeverity.Info:
      return 'ℹ️';
    default:
      return '⚠️';
  }
}

export function getAlertSubject(alert: AlertData): string {
  const severity = alert.severity;
  const emoji = getSeverityEmoji(severity);
  return `${emoji} Treasury Alert: ${alert.violatedRule} on ${alert.walletAddress}`;
}

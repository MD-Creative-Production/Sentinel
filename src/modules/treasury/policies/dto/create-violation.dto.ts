import { AlertSeverity, ViolationStatus } from '../enums';

export class CreateViolationDto {
  policyId!: string;
  policyName!: string;
  walletAddress!: string;
  chainId!: number;
  transactionHash!: string;
  transactionBlock?: string;
  violatedRule!: string;
  thresholdValue!: string;
  observedValue!: string;
  transactionAmount?: string;
  recipientAddress?: string;
  balanceBefore?: string;
  balanceAfter?: string;
  severity!: AlertSeverity;
  status?: ViolationStatus;
  recommendedAction?: string;
  contextData?: Record<string, unknown>;
}

import { PolicyType, PolicyStatus, AlertSeverity, ThresholdType } from '../enums';

export class CreateTreasuryPolicyDto {
  policyName!: string;
  description?: string;
  policyType!: PolicyType;
  status?: PolicyStatus;
  walletAddress!: string;
  chainId!: number;
  thresholdType!: ThresholdType;
  thresholdValue!: string;
  thresholdConfig?: Record<string, unknown>;
  severity?: AlertSeverity;
  notificationPreferences?: Record<string, unknown>;
  approvedAddresses?: string[];
  businessHoursStart?: string;
  businessHoursEnd?: string;
  timeZone?: string;
}

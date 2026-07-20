import { PolicyType, PolicyStatus } from '../enums';

export class TreasuryPolicyQueryDto {
  walletAddress?: string;
  chainId?: number;
  policyType?: PolicyType;
  status?: PolicyStatus;
  limit?: number;
  offset?: number;
}

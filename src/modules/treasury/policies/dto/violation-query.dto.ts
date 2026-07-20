import { ViolationStatus, AlertSeverity } from '../enums';

export class ViolationQueryDto {
  policyId?: string;
  walletAddress?: string;
  chainId?: number;
  transactionHash?: string;
  status?: ViolationStatus;
  severity?: AlertSeverity;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Data Transfer Objects and Interfaces for Multisig Monitoring
 */

export interface MultisigWalletDto {
  address: string;
  name: string;
  description?: string;
  threshold: number;
  totalSigners: number;
  organizationName?: string;
}

export interface SignerDto {
  address: string;
  name?: string;
}

export interface SignerUpdateDto {
  walletId: string;
  signer: SignerDto;
  action: 'add' | 'remove';
}

export interface ThresholdChangeDto {
  walletId: string;
  previousThreshold: number;
  newThreshold: number;
  actor: string;
}

export interface ApprovalDto {
  walletId: string;
  transactionId: string;
  transactionHash: string;
  signerId?: string;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  metadata?: Record<string, any>;
}

export interface MultisigEventDto {
  walletId: string;
  eventType:
    | 'signer_added'
    | 'signer_removed'
    | 'threshold_changed'
    | 'approval_requested'
    | 'approval_given'
    | 'transaction_executed';
  actor?: string;
  previousValue?: string;
  newValue?: string;
  transactionHash?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'critical';
}

export interface MultisigAlertPayload {
  walletAddress: string;
  walletName: string;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actor?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface MultisigActivityResponse {
  walletId: string;
  address: string;
  name: string;
  currentThreshold: number;
  totalSigners: number;
  activeSigners: number;
  recentActivity: MultisigEventDto[];
  pendingApprovals: ApprovalDto[];
}

export type MultisigEventType =
  | 'SIGNER_ADDED'
  | 'SIGNER_REMOVED'
  | 'THRESHOLD_CHANGED'
  | 'APPROVAL_SUBMITTED'
  | 'EXECUTION_SUCCESS'
  | 'EXECUTION_FAILED';

export interface MultisigAccountConfig {
  address: string;
  network: string;
  threshold: number;
  signers: string[];
}

export interface MultisigEvent {
  id: string;
  multisigAddress: string;
  network: string;
  type: MultisigEventType;
  txHash: string;
  signer?: string;
  newThreshold?: number;
  oldThreshold?: number;
  addedSigner?: string;
  removedSigner?: string;
  currentApprovals?: number;
  requiredApprovals?: number;
  timestamp: Date;
}

export interface MultisigAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  multisigAddress: string;
  title: string;
  message: string;
  event: MultisigEvent;
  timestamp: Date;
}

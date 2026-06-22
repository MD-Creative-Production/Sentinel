export enum ProposalState {
  Pending = 'Pending',
  Active = 'Active',
  Canceled = 'Canceled',
  Defeated = 'Defeated',
  Succeeded = 'Succeeded',
  Queued = 'Queued',
  Expired = 'Expired',
  Executed = 'Executed',
}

export enum ProposalEventType {
  Created = 'ProposalCreated',
  Canceled = 'ProposalCanceled',
  Queued = 'ProposalQueued',
  Executed = 'ProposalExecuted',
  VoteCast = 'VoteCast',
}

export interface ProposalCall {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

export interface ProposalMetadata {
  id: string;
  proposer: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  description: string;
  title: string;
  state: ProposalState;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  createdAt: Date;
  updatedAt: Date;
  transactionHash: string;
  blockNumber: number;
  executedAt?: Date;
  canceledAt?: Date;
  queuedAt?: Date;
  eta?: number; // timestamp for queued execution
}

export interface ProposalEvent {
  id: string; // <proposalId>-<eventType>-<txHash>
  proposalId: string;
  eventType: ProposalEventType;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface ProposalDetectionConfig {
  governorAddress: string;
  chainId: number;
  startBlock?: number;
  pollIntervalMs?: number;
}

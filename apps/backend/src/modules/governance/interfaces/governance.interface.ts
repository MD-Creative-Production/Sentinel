export interface GovernanceEventDto {
  eventType: string;
  proposalId?: string;
  voter?: string;
  transactionHash: string;
  // Use unknown to avoid eslint no-explicit-any while still allowing arbitrary metadata
  metadata?: unknown;
}

export interface ProposalDto {
  title: string;
  description: string;
  proposer: string;
}

export interface VoteDto {
  proposalId: string;
  voter: string;
  choice: string;
  weight: string;
}

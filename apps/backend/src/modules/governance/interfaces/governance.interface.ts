export interface GovernanceEventDto {
  eventType: string;
  proposalId?: string;
  voter?: string;
  transactionHash: string;
  metadata?: Record<string, any>;
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

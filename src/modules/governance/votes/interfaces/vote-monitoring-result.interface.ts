import { VoteOutcome } from '../enums/vote-outcome.enum';

export interface VoteMonitoringResult {
  proposalId: string;
  chainId: number;
  previousOutcome?: VoteOutcome;
  currentOutcome: VoteOutcome;
  stateChanged: boolean;
  votesUpdated: boolean;
  timestamp: Date;
}

export interface ProposalVoteData {
  proposalId: string;
  chainId: number;
  title: string;
  description?: string;
  votingStartTime: Date;
  votingEndTime: Date;
  totalVotes: string;
  yesVotes: string;
  noVotes: string;
  abstainVotes: string;
  vetoVotes?: string;
  participationPercentage?: number;
  currentState: string;
}

import { VoteOutcome } from '../enums/vote-outcome.enum';
import { ProposalType } from '../enums/proposal-type.enum';
import { ProposalImpact } from '../enums/proposal-impact.enum';

export class CreateVoteOutcomeDto {
  proposalId!: string;
  chainId!: number;
  proposalTitle!: string;
  proposalDescription?: string;
  proposalType?: ProposalType;
  proposalImpact?: ProposalImpact;
  outcome?: VoteOutcome;
  votingStartTime!: Date;
  votingEndTime!: Date;
  votingEndedAt?: Date;
  executionTimestamp?: Date;
  totalVotes?: string;
  yesVotes?: string;
  noVotes?: string;
  abstainVotes?: string;
  vetoVotes?: string;
  participationPercentage?: number;
  proposalLink?: string;
  previousState?: string;
}

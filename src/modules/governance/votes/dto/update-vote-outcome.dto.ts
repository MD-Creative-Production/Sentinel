import { VoteOutcome } from '../enums/vote-outcome.enum';
import { ProposalType } from '../enums/proposal-type.enum';
import { ProposalImpact } from '../enums/proposal-impact.enum';

export class UpdateVoteOutcomeDto {
  outcome?: VoteOutcome;
  votingEndedAt?: Date;
  executionTimestamp?: Date;
  totalVotes?: string;
  yesVotes?: string;
  noVotes?: string;
  abstainVotes?: string;
  vetoVotes?: string;
  participationPercentage?: number;
  proposalType?: ProposalType;
  proposalImpact?: ProposalImpact;
  processed?: boolean;
  previousState?: string;
}

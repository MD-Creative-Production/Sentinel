import { VoteOutcome } from '../enums/vote-outcome.enum';
import { ProposalType } from '../enums/proposal-type.enum';
import { ProposalImpact } from '../enums/proposal-impact.enum';

export class VoteOutcomeQueryDto {
  chainId?: number;
  proposalId?: string;
  outcome?: VoteOutcome;
  proposalType?: ProposalType;
  proposalImpact?: ProposalImpact;
  fromVotingEndedAt?: Date;
  toVotingEndedAt?: Date;
  processed?: boolean;
  limit?: number;
  offset?: number;
}

import { ProposalType } from '../enums/proposal-type.enum';
import { ProposalImpact } from '../enums/proposal-impact.enum';

export interface GovernanceVoteConfig {
  chainId: number;
  governorAddress: string;
  pollIntervalMs?: number;
  enabled?: boolean;
  networkName?: string;
  proposalLinkTemplate?: string;
}

export interface ProposalClassificationRule {
  keywords: string[];
  type: ProposalType;
  impact: ProposalImpact;
}

export interface GovernanceVoteMonitoringConfig {
  chains: GovernanceVoteConfig[];
  classificationRules: ProposalClassificationRule[];
  defaultPollIntervalMs: number;
  alertEnabled: boolean;
}

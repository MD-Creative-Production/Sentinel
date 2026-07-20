import { ProposalType, ProposalImpact } from '../enums';

export interface ProposalClassification {
  type: ProposalType;
  impact: ProposalImpact;
}

const DEFAULT_CLASSIFICATION: ProposalClassification = {
  type: ProposalType.Other,
  impact: ProposalImpact.LowImpact,
};

const CLASSIFICATION_RULES: Array<{
  keywords: string[];
  type: ProposalType;
  impact: ProposalImpact;
}> = [
  {
    keywords: ['upgrade', 'migration', 'contract upgrade', 'implementation'],
    type: ProposalType.ProtocolUpgrade,
    impact: ProposalImpact.ProtocolUpgrade,
  },
  {
    keywords: ['validator', 'node operator', 'staking', 'slashing'],
    type: ProposalType.ValidatorChange,
    impact: ProposalImpact.ValidatorChange,
  },
  {
    keywords: ['treasury', 'grant', 'funding', 'budget', 'allocation'],
    type: ProposalType.TreasuryAllocation,
    impact: ProposalImpact.TreasuryChange,
  },
  {
    keywords: ['parameter', 'threshold', 'quorum', 'timelock', 'delay'],
    type: ProposalType.ParameterChange,
    impact: ProposalImpact.GovernanceParameterChange,
  },
  {
    keywords: ['security', 'emergency', 'pause', 'unpause', 'critical'],
    type: ProposalType.SecurityProposal,
    impact: ProposalImpact.SecurityRelated,
  },
  {
    keywords: ['emergency', 'urgent', 'immediate'],
    type: ProposalType.EmergencyAction,
    impact: ProposalImpact.SecurityRelated,
  },
  {
    keywords: ['feature', 'enable', 'activate', 'new'],
    type: ProposalType.NetworkFeature,
    impact: ProposalImpact.LowImpact,
  },
];

export function classifyProposal(description: string, title: string): ProposalClassification {
  const text = `${title} ${description}`.toLowerCase();

  for (const rule of CLASSIFICATION_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return {
          type: rule.type,
          impact: rule.impact,
        };
      }
    }
  }

  return DEFAULT_CLASSIFICATION;
}

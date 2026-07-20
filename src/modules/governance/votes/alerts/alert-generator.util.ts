import { VoteOutcome, ProposalImpact, AlertSeverity } from '../enums';

export interface AlertData {
  proposalId: string;
  chainId: number;
  proposalTitle: string;
  alertType: string;
  severity: AlertSeverity;
  outcome?: string;
  message: string;
  proposalLink?: string;
  network?: string;
  metadata?: Record<string, unknown>;
  impact?: ProposalImpact;
}

const OUTCOME_ALERT_MAP: Record<VoteOutcome, (data: AlertData) => AlertData | null> = {
  [VoteOutcome.Passed]: data => ({
    ...data,
    alertType: 'PROPOSAL_PASSED',
    severity:
      data.impact === ProposalImpact.SecurityRelated ? AlertSeverity.Critical : AlertSeverity.High,
    outcome: VoteOutcome.Passed,
    message: `Proposal "${data.proposalTitle}" has passed voting`,
  }),
  [VoteOutcome.Rejected]: data => ({
    ...data,
    alertType: 'PROPOSAL_REJECTED',
    severity: AlertSeverity.Medium,
    outcome: VoteOutcome.Rejected,
    message: `Proposal "${data.proposalTitle}" has been rejected`,
  }),
  [VoteOutcome.Executed]: data => ({
    ...data,
    alertType: 'PROPOSAL_EXECUTED',
    severity:
      data.impact === ProposalImpact.SecurityRelated ? AlertSeverity.Critical : AlertSeverity.High,
    outcome: VoteOutcome.Executed,
    message: `Proposal "${data.proposalTitle}" has been executed`,
  }),
  [VoteOutcome.Expired]: data => ({
    ...data,
    alertType: 'PROPOSAL_EXPIRED',
    severity: AlertSeverity.Low,
    outcome: VoteOutcome.Expired,
    message: `Proposal "${data.proposalTitle}" has expired without execution`,
  }),
  [VoteOutcome.Cancelled]: data => ({
    ...data,
    alertType: 'PROPOSAL_CANCELLED',
    severity: AlertSeverity.Low,
    outcome: VoteOutcome.Cancelled,
    message: `Proposal "${data.proposalTitle}" has been cancelled`,
  }),
  [VoteOutcome.Pending]: () => null,
};

const IMPACT_ALERT_MAP: Record<ProposalImpact, AlertSeverity> = {
  [ProposalImpact.ProtocolUpgrade]: AlertSeverity.High,
  [ProposalImpact.ValidatorChange]: AlertSeverity.High,
  [ProposalImpact.TreasuryChange]: AlertSeverity.Medium,
  [ProposalImpact.GovernanceParameterChange]: AlertSeverity.Medium,
  [ProposalImpact.ContractMigration]: AlertSeverity.High,
  [ProposalImpact.SecurityRelated]: AlertSeverity.Critical,
  [ProposalImpact.LowImpact]: AlertSeverity.Low,
};

export function generateAlertForOutcome(
  proposalId: string,
  chainId: number,
  proposalTitle: string,
  outcome: VoteOutcome,
  impact: ProposalImpact,
  proposalLink?: string,
  network?: string,
): AlertData | null {
  const baseData: AlertData = {
    proposalId,
    chainId,
    proposalTitle,
    alertType: '',
    severity: AlertSeverity.Info,
    outcome,
    message: '',
    proposalLink,
    network,
    metadata: { impact },
  };

  const alertGenerator = OUTCOME_ALERT_MAP[outcome];
  if (!alertGenerator) {
    return null;
  }

  const alertData = alertGenerator(baseData);
  if (!alertData) {
    return null;
  }

  alertData.severity = IMPACT_ALERT_MAP[impact] || alertData.severity;

  if (impact === ProposalImpact.SecurityRelated && outcome === VoteOutcome.Passed) {
    alertData.alertType = 'EMERGENCY_PROPOSAL_APPROVED';
    alertData.message = `EMERGENCY: Security-related proposal "${proposalTitle}" has been approved`;
  }

  if (impact === ProposalImpact.ProtocolUpgrade && outcome === VoteOutcome.Passed) {
    alertData.alertType = 'HIGH_IMPACT_PROTOCOL_UPGRADE';
    alertData.message = `HIGH IMPACT: Protocol upgrade proposal "${proposalTitle}" has been approved`;
  }

  if (impact === ProposalImpact.TreasuryChange && outcome === VoteOutcome.Passed) {
    alertData.alertType = 'TREASURY_PROPOSAL_APPROVED';
    alertData.message = `Treasury proposal "${proposalTitle}" has been approved`;
  }

  return alertData;
}

export function getNetworkName(chainId: number): string {
  const networkMap: Record<number, string> = {
    1: 'Ethereum Mainnet',
    10: 'Optimism',
    56: 'BSC',
    137: 'Polygon',
    250: 'Fantom',
    42161: 'Arbitrum',
    43114: 'Avalanche',
  };

  return networkMap[chainId] || `Chain ${chainId}`;
}

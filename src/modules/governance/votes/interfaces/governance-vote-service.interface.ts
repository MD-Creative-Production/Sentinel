import { VoteMonitoringResult, ProposalVoteData } from './vote-monitoring-result.interface';

export interface IGovernanceVoteService {
  monitorProposals(): Promise<VoteMonitoringResult[]>;
  checkProposal(proposalId: string, chainId: number): Promise<VoteMonitoringResult>;
  getActiveProposals(chainId: number): Promise<ProposalVoteData[]>;
  getProposalVoteData(proposalId: string, chainId: number): Promise<ProposalVoteData | null>;
  isVotingEnded(proposalId: string, chainId: number): Promise<boolean>;
}

export interface IGovernanceVoteProcessor {
  processVoteResult(result: VoteMonitoringResult): Promise<void>;
  processVoteResults(results: VoteMonitoringResult[]): Promise<void>;
}

export interface IGovernanceVoteScheduler {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

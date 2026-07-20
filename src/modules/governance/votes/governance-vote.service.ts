import { ethers } from 'ethers';
import { Logger } from '../../../utils/logger';
import { ProposalRepository } from '../proposals/ProposalRepository';
import { ProposalDetector } from '../proposals/ProposalDetector';
import { ProposalState } from '../proposals/types';
import { GovernanceVoteRepository } from './governance-vote.repository';
import { VoteOutcome } from './enums';
import { VoteOutcomeEntity } from './entities/vote-outcome.entity';
import { IGovernanceVoteService, VoteMonitoringResult, ProposalVoteData } from './interfaces';
import { GovernanceVoteConfig } from './interfaces/governance-vote-config.interface';
import { classifyProposal } from './utils/proposal-classifier.util';

const STATE_TO_OUTCOME_MAP: Record<ProposalState, VoteOutcome> = {
  [ProposalState.Pending]: VoteOutcome.Pending,
  [ProposalState.Active]: VoteOutcome.Pending,
  [ProposalState.Canceled]: VoteOutcome.Cancelled,
  [ProposalState.Defeated]: VoteOutcome.Rejected,
  [ProposalState.Succeeded]: VoteOutcome.Passed,
  [ProposalState.Queued]: VoteOutcome.Passed,
  [ProposalState.Expired]: VoteOutcome.Expired,
  [ProposalState.Executed]: VoteOutcome.Executed,
};

export class GovernanceVoteService implements IGovernanceVoteService {
  private logger: Logger;
  private detectors: Map<number, ProposalDetector> = new Map();
  private configs: GovernanceVoteConfig[] = [];

  constructor(
    private proposalRepository: ProposalRepository,
    private voteRepository: GovernanceVoteRepository,
    private provider: ethers.Provider,
    configs: GovernanceVoteConfig[],
  ) {
    this.logger = new Logger('GovernanceVoteService');
    this.configs = configs.filter(c => c.enabled !== false);
    this.initializeDetectors();
  }

  private initializeDetectors(): void {
    for (const config of this.configs) {
      const detector = new ProposalDetector(this.provider, {
        governorAddress: config.governorAddress,
        chainId: config.chainId,
        pollIntervalMs: config.pollIntervalMs,
      });
      this.detectors.set(config.chainId, detector);
      this.logger.info(`Initialized detector for chain ${config.chainId}`);
    }
  }

  async monitorProposals(): Promise<VoteMonitoringResult[]> {
    this.logger.info('Starting proposal monitoring cycle');
    const results: VoteMonitoringResult[] = [];

    for (const config of this.configs) {
      try {
        const chainResults = await this.monitorChain(config.chainId);
        results.push(...chainResults);
      } catch (error) {
        this.logger.error(`Failed to monitor chain ${config.chainId}`, error);
      }
    }

    this.logger.info(`Monitoring cycle complete. Processed ${results.length} proposals`);
    return results;
  }

  private async monitorChain(chainId: number): Promise<VoteMonitoringResult[]> {
    this.logger.debug(`Monitoring chain ${chainId}`);
    const results: VoteMonitoringResult[] = [];

    const { items: activeProposals } = await this.proposalRepository.searchProposals(chainId, {
      state: ProposalState.Active,
      limit: 100,
    });

    const { items: succeededProposals } = await this.proposalRepository.searchProposals(chainId, {
      state: ProposalState.Succeeded,
      limit: 50,
    });

    const { items: queuedProposals } = await this.proposalRepository.searchProposals(chainId, {
      state: ProposalState.Queued,
      limit: 50,
    });

    const proposalsToCheck = [...activeProposals, ...succeededProposals, ...queuedProposals];

    for (const proposal of proposalsToCheck) {
      try {
        const result = await this.checkProposal(proposal.proposalId, chainId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to check proposal ${proposal.proposalId}`, error);
      }
    }

    return results;
  }

  async checkProposal(proposalId: string, chainId: number): Promise<VoteMonitoringResult> {
    this.logger.debug(`Checking proposal ${proposalId} on chain ${chainId}`);

    const detector = this.detectors.get(chainId);
    if (!detector) {
      throw new Error(`No detector found for chain ${chainId}`);
    }

    const currentState = await detector.getProposalState(proposalId);
    const votes = await detector.getProposalVotes(proposalId);

    const existingOutcome = await this.voteRepository.findVoteOutcome(proposalId, chainId);
    const previousOutcome = existingOutcome?.outcome;

    const currentOutcome = STATE_TO_OUTCOME_MAP[currentState];
    const stateChanged = previousOutcome !== currentOutcome;

    const votingEnded = this.isVotingEndedState(currentState);
    const votingEndedAt = votingEnded ? new Date() : undefined;

    const executionTimestamp = currentState === ProposalState.Executed ? new Date() : undefined;

    const totalVotes = this.sumVotes(votes.forVotes, votes.againstVotes, votes.abstainVotes);
    const participationPercentage = existingOutcome
      ? this.calculateParticipationPercentage(totalVotes, existingOutcome)
      : undefined;

    const proposal = await this.proposalRepository.findProposal(proposalId, chainId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found in repository`);
    }

    const classification = classifyProposal(proposal.description, proposal.title);

    await this.voteRepository.upsertVoteOutcome({
      proposalId,
      chainId,
      proposalTitle: proposal.title,
      proposalDescription: proposal.description,
      proposalType: classification.type,
      proposalImpact: classification.impact,
      outcome: currentOutcome,
      votingStartTime: new Date(),
      votingEndTime: new Date(),
      votingEndedAt,
      executionTimestamp,
      totalVotes,
      yesVotes: votes.forVotes,
      noVotes: votes.againstVotes,
      abstainVotes: votes.abstainVotes,
      vetoVotes: '0',
      participationPercentage,
      proposalLink: this.generateProposalLink(proposalId, chainId),
      previousState: previousOutcome,
    });

    const votesUpdated = this.votesChanged(existingOutcome, votes);

    this.logger.debug(
      `Proposal ${proposalId}: ${previousOutcome} -> ${currentOutcome}, votesUpdated: ${votesUpdated}`,
    );

    return {
      proposalId,
      chainId,
      previousOutcome,
      currentOutcome,
      stateChanged,
      votesUpdated,
      timestamp: new Date(),
    };
  }

  async getActiveProposals(chainId: number): Promise<ProposalVoteData[]> {
    const { items: activeProposals } = await this.proposalRepository.searchProposals(chainId, {
      state: ProposalState.Active,
      limit: 100,
    });

    const voteData: ProposalVoteData[] = [];

    for (const proposal of activeProposals) {
      try {
        const data = await this.getProposalVoteData(proposal.proposalId, chainId);
        if (data) {
          voteData.push(data);
        }
      } catch (error) {
        this.logger.error(`Failed to get vote data for proposal ${proposal.proposalId}`, error);
      }
    }

    return voteData;
  }

  async getProposalVoteData(proposalId: string, chainId: number): Promise<ProposalVoteData | null> {
    const proposal = await this.proposalRepository.findProposal(proposalId, chainId);
    if (!proposal) {
      return null;
    }

    const detector = this.detectors.get(chainId);
    if (!detector) {
      return null;
    }

    const votes = await detector.getProposalVotes(proposalId);
    const totalVotes = this.sumVotes(votes.forVotes, votes.againstVotes, votes.abstainVotes);

    return {
      proposalId,
      chainId,
      title: proposal.title,
      description: proposal.description,
      votingStartTime: new Date(),
      votingEndTime: new Date(),
      totalVotes,
      yesVotes: votes.forVotes,
      noVotes: votes.againstVotes,
      abstainVotes: votes.abstainVotes,
      participationPercentage: undefined,
      currentState: proposal.state,
    };
  }

  async isVotingEnded(proposalId: string, chainId: number): Promise<boolean> {
    const detector = this.detectors.get(chainId);
    if (!detector) {
      throw new Error(`No detector found for chain ${chainId}`);
    }

    const state = await detector.getProposalState(proposalId);
    return this.isVotingEndedState(state);
  }

  private isVotingEndedState(state: ProposalState): boolean {
    return [
      ProposalState.Succeeded,
      ProposalState.Defeated,
      ProposalState.Expired,
      ProposalState.Canceled,
      ProposalState.Executed,
    ].includes(state);
  }

  private sumVotes(...voteStrings: string[]): string {
    return voteStrings
      .reduce((sum, votes) => {
        const voteValue = BigInt(votes || '0');
        return sum + voteValue;
      }, BigInt(0))
      .toString();
  }

  private votesChanged(
    existingOutcome: VoteOutcomeEntity | null,
    currentVotes: { forVotes: string; againstVotes: string; abstainVotes: string },
  ): boolean {
    if (!existingOutcome) {
      return true;
    }

    return (
      existingOutcome.yesVotes !== currentVotes.forVotes ||
      existingOutcome.noVotes !== currentVotes.againstVotes ||
      existingOutcome.abstainVotes !== currentVotes.abstainVotes
    );
  }

  private calculateParticipationPercentage(
    totalVotes: string,
    existingOutcome: VoteOutcomeEntity | null,
  ): number | undefined {
    if (!existingOutcome || !existingOutcome.totalVotes || existingOutcome.totalVotes === '0') {
      return undefined;
    }

    const total = BigInt(totalVotes);
    const previousTotal = BigInt(existingOutcome.totalVotes);

    if (total === previousTotal) {
      return existingOutcome.participationPercentage;
    }

    return undefined;
  }

  private generateProposalLink(proposalId: string, chainId: number): string {
    const config = this.configs.find(c => c.chainId === chainId);
    if (config?.proposalLinkTemplate) {
      return config.proposalLinkTemplate.replace('{proposalId}', proposalId);
    }
    return '';
  }
}

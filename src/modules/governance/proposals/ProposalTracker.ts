import { ethers } from 'ethers';
import { DataSource } from 'typeorm';
import { ProposalDetector } from './ProposalDetector';
import { ProposalRepository } from './ProposalRepository';
import { ProposalDetectionConfig, ProposalState } from './types';
import { Logger } from '../../../utils/logger';

const DEFAULT_POLL_INTERVAL_MS = 12_000;

export class ProposalTracker {
  private detector: ProposalDetector;
  private repo: ProposalRepository;
  private logger: Logger;
  private config: ProposalDetectionConfig;
  private stateRefreshInterval?: NodeJS.Timer;

  constructor(
    provider: ethers.Provider,
    dataSource: DataSource,
    config: ProposalDetectionConfig,
    detector?: ProposalDetector, // injectable for testing
  ) {
    this.config = config;
    this.detector = detector ?? new ProposalDetector(provider, config);
    this.repo = new ProposalRepository(dataSource);
    this.logger = new Logger(`ProposalTracker[chain=${config.chainId}]`);
  }

  async start(): Promise<void> {
    this.logger.info('Starting governance proposal tracker');
    const lastBlock = await this.repo.getLastIndexedBlock(this.config.chainId);
    const fromBlock = lastBlock ?? this.config.startBlock ?? 0;
    await this.backfill(fromBlock);
    this.subscribeToLiveEvents();
    this.scheduleStateRefresh();
    this.logger.info('Proposal tracker running');
  }

  stop(): void {
    this.detector.unsubscribe();
    if (this.stateRefreshInterval) {
      clearInterval(this.stateRefreshInterval as unknown as number);
    }
    this.logger.info('Proposal tracker stopped');
  }

  private async backfill(fromBlock: number): Promise<void> {
    this.logger.info(`Backfilling proposals from block ${fromBlock}`);
    try {
      const proposals = await this.detector.fetchHistoricalProposals(fromBlock, 'latest');
      for (const { metadata, events } of proposals) {
        await this.repo.upsertProposal(metadata, this.config.chainId);
        for (const event of events) {
          await this.repo.persistEvent(event, this.config.chainId);
        }
      }
      this.logger.info(`Backfill complete — ${proposals.length} proposals indexed`);
    } catch (err) {
      this.logger.error('Backfill failed', err);
      throw err;
    }
  }

  private subscribeToLiveEvents(): void {
    this.detector.subscribe({
      onProposalCreated: async (metadata, event) => {
        this.logger.info(`New proposal detected: #${metadata.id} — "${metadata.title}"`);
        await this.repo.upsertProposal(metadata, this.config.chainId);
        await this.repo.persistEvent(event, this.config.chainId);
      },
      onProposalCanceled: async (proposalId, event) => {
        this.logger.info(`Proposal #${proposalId} canceled`);
        await this.repo.updateProposalState(
          proposalId,
          this.config.chainId,
          ProposalState.Canceled,
          { canceledAt: event.timestamp },
        );
        await this.repo.persistEvent(event, this.config.chainId);
      },
      onProposalQueued: async (proposalId, eta, event) => {
        this.logger.info(`Proposal #${proposalId} queued (eta: ${eta})`);
        await this.repo.updateProposalState(proposalId, this.config.chainId, ProposalState.Queued, {
          queuedAt: event.timestamp,
          eta,
        });
        await this.repo.persistEvent(event, this.config.chainId);
      },
      onProposalExecuted: async (proposalId, event) => {
        this.logger.info(`Proposal #${proposalId} executed`);
        const votes = await this.detector.getProposalVotes(proposalId);
        await this.repo.updateProposalState(
          proposalId,
          this.config.chainId,
          ProposalState.Executed,
          { executedAt: event.timestamp, ...votes },
        );
        await this.repo.persistEvent(event, this.config.chainId);
      },
      onVoteCast: async (proposalId, voter, support, weight, event) => {
        this.logger.debug(`Vote on #${proposalId}: ${voter} support=${support} weight=${weight}`);
        const votes = await this.detector.getProposalVotes(proposalId);
        await this.repo.updateProposalState(
          proposalId,
          this.config.chainId,
          await this.detector.getProposalState(proposalId),
          votes,
        );
        await this.repo.persistEvent(event, this.config.chainId);
      },
    });
  }

  private scheduleStateRefresh(): void {
    const interval = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.stateRefreshInterval = setInterval(async () => {
      try {
        await this.refreshActiveProposalStates();
      } catch (err) {
        this.logger.error('State refresh error', err);
      }
    }, interval);
  }

  private async refreshActiveProposalStates(): Promise<void> {
    const { items } = await this.repo.searchProposals(this.config.chainId, {
      state: ProposalState.Active,
      limit: 100,
    });
    for (const proposal of items) {
      const current = await this.detector.getProposalState(proposal.proposalId);
      if (current !== proposal.state) {
        this.logger.info(`Proposal #${proposal.proposalId} state: ${proposal.state} → ${current}`);
        const votes = await this.detector.getProposalVotes(proposal.proposalId);
        await this.repo.updateProposalState(
          proposal.proposalId,
          this.config.chainId,
          current,
          votes,
        );
      }
    }
  }
}

import { ethers } from 'ethers';
import { Logger } from '../../../utils/logger';
import {
  ProposalDetectionConfig,
  ProposalEvent,
  ProposalEventType,
  ProposalMetadata,
  ProposalState,
} from './types';

// Standard Governor Bravo / OZ Governor ABI (proposal lifecycle events)
const GOVERNOR_ABI = [
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
  'event ProposalCanceled(uint256 proposalId)',
  'event ProposalQueued(uint256 proposalId, uint256 eta)',
  'event ProposalExecuted(uint256 proposalId)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
  'function state(uint256 proposalId) external view returns (uint8)',
  'function proposals(uint256 proposalId) external view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)',
];

const STATE_MAP: Record<number, ProposalState> = {
  0: ProposalState.Pending,
  1: ProposalState.Active,
  2: ProposalState.Canceled,
  3: ProposalState.Defeated,
  4: ProposalState.Succeeded,
  5: ProposalState.Queued,
  6: ProposalState.Expired,
  7: ProposalState.Executed,
};

export class ProposalDetector {
  private contract: ethers.Contract;
  private logger: Logger;
  private config: ProposalDetectionConfig;
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider, config: ProposalDetectionConfig) {
    this.provider = provider;
    this.config = config;
    this.contract = new ethers.Contract(config.governorAddress, GOVERNOR_ABI, provider);
    this.logger = new Logger('ProposalDetector');
  }

  /**
   * Fetch all historical ProposalCreated events from startBlock to latest.
   */
  async fetchHistoricalProposals(
    fromBlock: number,
    toBlock: number | 'latest' = 'latest',
  ): Promise<{ metadata: ProposalMetadata; events: ProposalEvent[] }[]> {
    this.logger.info(`Fetching historical proposals from block ${fromBlock} to ${toBlock}`);

    const filter = this.contract.filters.ProposalCreated();
    const logs = await this.contract.queryFilter(filter, fromBlock, toBlock);

    const results = await Promise.all(
      logs.map(log => this.parseCreatedLog(log as ethers.EventLog)),
    );

    this.logger.info(`Found ${results.length} historical proposals`);
    return results;
  }

  /**
   * Subscribe to live governance events and emit via callbacks.
   */
  subscribe(handlers: {
    onProposalCreated: (metadata: ProposalMetadata, event: ProposalEvent) => Promise<void>;
    onProposalCanceled: (proposalId: string, event: ProposalEvent) => Promise<void>;
    onProposalQueued: (proposalId: string, eta: number, event: ProposalEvent) => Promise<void>;
    onProposalExecuted: (proposalId: string, event: ProposalEvent) => Promise<void>;
    onVoteCast: (
      proposalId: string,
      voter: string,
      support: number,
      weight: string,
      event: ProposalEvent,
    ) => Promise<void>;
  }): void {
    this.logger.info(`Subscribing to governor events at ${this.config.governorAddress}`);

    this.contract.on(
      'ProposalCreated',
      async (
        proposalId,
        proposer,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        description,
        log,
      ) => {
        try {
          const { metadata, events } = await this.parseCreatedLog(log as ethers.EventLog);
          await handlers.onProposalCreated(metadata, events[0]);
        } catch (err) {
          this.logger.error('Error handling ProposalCreated', err);
        }
      },
    );

    this.contract.on('ProposalCanceled', async (proposalId, log) => {
      try {
        const event = await this.buildEvent(log as ethers.EventLog, ProposalEventType.Canceled, {
          proposalId: proposalId.toString(),
        });
        await handlers.onProposalCanceled(proposalId.toString(), event);
      } catch (err) {
        this.logger.error('Error handling ProposalCanceled', err);
      }
    });

    this.contract.on('ProposalQueued', async (proposalId, eta, log) => {
      try {
        const event = await this.buildEvent(log as ethers.EventLog, ProposalEventType.Queued, {
          proposalId: proposalId.toString(),
          eta: eta.toString(),
        });
        await handlers.onProposalQueued(proposalId.toString(), Number(eta), event);
      } catch (err) {
        this.logger.error('Error handling ProposalQueued', err);
      }
    });

    this.contract.on('ProposalExecuted', async (proposalId, log) => {
      try {
        const event = await this.buildEvent(log as ethers.EventLog, ProposalEventType.Executed, {
          proposalId: proposalId.toString(),
        });
        await handlers.onProposalExecuted(proposalId.toString(), event);
      } catch (err) {
        this.logger.error('Error handling ProposalExecuted', err);
      }
    });

    this.contract.on('VoteCast', async (voter, proposalId, support, weight, reason, log) => {
      try {
        const event = await this.buildEvent(log as ethers.EventLog, ProposalEventType.VoteCast, {
          voter,
          proposalId: proposalId.toString(),
          support: Number(support),
          weight: weight.toString(),
          reason,
        });
        await handlers.onVoteCast(
          proposalId.toString(),
          voter,
          Number(support),
          weight.toString(),
          event,
        );
      } catch (err) {
        this.logger.error('Error handling VoteCast', err);
      }
    });
  }

  unsubscribe(): void {
    this.contract.removeAllListeners();
    this.logger.info('Unsubscribed from all governor events');
  }

  /**
   * Fetch current on-chain state for a proposal.
   */
  async getProposalState(proposalId: string): Promise<ProposalState> {
    const stateNum: number = await this.contract.state(proposalId);
    return STATE_MAP[stateNum] ?? ProposalState.Pending;
  }

  /**
   * Fetch vote tallies for a proposal.
   */
  async getProposalVotes(
    proposalId: string,
  ): Promise<{ forVotes: string; againstVotes: string; abstainVotes: string }> {
    const proposal = await this.contract.proposals(proposalId);
    return {
      forVotes: proposal.forVotes.toString(),
      againstVotes: proposal.againstVotes.toString(),
      abstainVotes: proposal.abstainVotes.toString(),
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async parseCreatedLog(
    log: ethers.EventLog,
  ): Promise<{ metadata: ProposalMetadata; events: ProposalEvent[] }> {
    const {
      proposalId,
      proposer,
      targets,
      values,
      signatures,
      calldatas,
      startBlock,
      endBlock,
      description,
    } = log.args;

    const block = await log.getBlock();
    const timestamp = new Date(block.timestamp * 1000);
    const id = proposalId.toString();

    // Parse title from description (markdown convention: first line is # Title)
    const title = this.extractTitle(description);

    const state = await this.getProposalState(id).catch(() => ProposalState.Pending);

    const metadata: ProposalMetadata = {
      id,
      proposer,
      targets: targets as string[],
      values: (values as unknown as bigint[]).map(v => v.toString()),
      signatures: signatures as string[],
      calldatas: calldatas as string[],
      startBlock: Number(startBlock),
      endBlock: Number(endBlock),
      description,
      title,
      state,
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      createdAt: timestamp,
      updatedAt: timestamp,
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
    };

    const event = await this.buildEvent(log, ProposalEventType.Created, {
      proposalId: id,
      proposer,
      title,
    });

    return { metadata, events: [event] };
  }

  private async buildEvent(
    log: ethers.EventLog,
    eventType: ProposalEventType,
    data: Record<string, unknown>,
  ): Promise<ProposalEvent> {
    const block = await log.getBlock();
    const proposalId = (data.proposalId as string) ?? 'unknown';
    return {
      id: `${proposalId}-${eventType}-${log.transactionHash}`,
      proposalId,
      eventType,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      timestamp: new Date(block.timestamp * 1000),
      data,
    };
  }

  private extractTitle(description: string): string {
    const firstLine = description.split('\n')[0].trim();
    return firstLine.startsWith('#') ? firstLine.replace(/^#+\s*/, '') : firstLine.slice(0, 100);
  }
}

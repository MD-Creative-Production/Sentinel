import { DataSource, Repository } from 'typeorm';
import { ProposalEntity } from './entities/ProposalEntity';
import { ProposalEventEntity } from './entities/ProposalEventEntity';
import { ProposalMetadata, ProposalEvent, ProposalState } from './types';
import { Logger } from '../../../utils/logger';

export interface ProposalSearchOptions {
  state?: ProposalState;
  proposer?: string;
  chainId?: number;
  fromBlock?: number;
  toBlock?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EventSearchOptions {
  proposalId?: string;
  eventType?: string;
  fromBlock?: number;
  toBlock?: number;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export class ProposalRepository {
  private proposalRepo: Repository<ProposalEntity>;
  private eventRepo: Repository<ProposalEventEntity>;
  private logger: Logger;

  constructor(private dataSource: DataSource) {
    this.proposalRepo = dataSource.getRepository(ProposalEntity);
    this.eventRepo = dataSource.getRepository(ProposalEventEntity);
    this.logger = new Logger('ProposalRepository');
  }

  // ─── Proposals ───────────────────────────────────────────────────────────────

  async upsertProposal(metadata: ProposalMetadata, chainId: number): Promise<ProposalEntity> {
    const existing = await this.proposalRepo.findOne({
      where: { proposalId: metadata.id, chainId },
    });

    if (existing) {
      const updated = this.proposalRepo.merge(existing, {
        state: metadata.state,
        forVotes: metadata.forVotes,
        againstVotes: metadata.againstVotes,
        abstainVotes: metadata.abstainVotes,
        executedAt: metadata.executedAt,
        canceledAt: metadata.canceledAt,
        queuedAt: metadata.queuedAt,
        eta: metadata.eta,
        updatedAt: new Date(),
      });
      await this.proposalRepo.save(updated);
      this.logger.debug(`Updated proposal ${metadata.id}`);
      return updated;
    }

    const entity = this.proposalRepo.create({
      proposalId: metadata.id,
      chainId,
      proposer: metadata.proposer,
      targets: metadata.targets,
      values: metadata.values,
      signatures: metadata.signatures,
      calldatas: metadata.calldatas,
      startBlock: metadata.startBlock,
      endBlock: metadata.endBlock,
      description: metadata.description,
      title: metadata.title,
      state: metadata.state,
      forVotes: metadata.forVotes,
      againstVotes: metadata.againstVotes,
      abstainVotes: metadata.abstainVotes,
      transactionHash: metadata.transactionHash,
      blockNumber: metadata.blockNumber,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    });

    await this.proposalRepo.save(entity);
    this.logger.info(`Inserted proposal ${metadata.id} (chain ${chainId})`);
    return entity;
  }

  async updateProposalState(
    proposalId: string,
    chainId: number,
    state: ProposalState,
    extra?: Partial<
      Pick<
        ProposalMetadata,
        | 'executedAt'
        | 'canceledAt'
        | 'queuedAt'
        | 'eta'
        | 'forVotes'
        | 'againstVotes'
        | 'abstainVotes'
      >
    >,
  ): Promise<void> {
    await this.proposalRepo.update(
      { proposalId, chainId },
      { state, updatedAt: new Date(), ...extra },
    );
    this.logger.debug(`State of proposal ${proposalId} → ${state}`);
  }

  async findProposal(proposalId: string, chainId: number): Promise<ProposalEntity | null> {
    return this.proposalRepo.findOne({ where: { proposalId, chainId } });
  }

  async searchProposals(
    chainId: number,
    opts: ProposalSearchOptions = {},
  ): Promise<{ items: ProposalEntity[]; total: number }> {
    const qb = this.proposalRepo.createQueryBuilder('p').where('p.chainId = :chainId', { chainId });

    if (opts.state) qb.andWhere('p.state = :state', { state: opts.state });
    if (opts.proposer) qb.andWhere('p.proposer = :proposer', { proposer: opts.proposer });
    if (opts.fromBlock) qb.andWhere('p.blockNumber >= :fromBlock', { fromBlock: opts.fromBlock });
    if (opts.toBlock) qb.andWhere('p.blockNumber <= :toBlock', { toBlock: opts.toBlock });
    if (opts.fromDate) qb.andWhere('p.createdAt >= :fromDate', { fromDate: opts.fromDate });
    if (opts.toDate) qb.andWhere('p.createdAt <= :toDate', { toDate: opts.toDate });

    qb.orderBy('p.blockNumber', 'DESC')
      .skip(opts.offset ?? 0)
      .take(opts.limit ?? 50);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  async persistEvent(event: ProposalEvent, chainId: number): Promise<ProposalEventEntity> {
    const exists = await this.eventRepo.findOne({ where: { eventId: event.id } });
    if (exists) {
      this.logger.debug(`Event ${event.id} already persisted, skipping`);
      return exists;
    }

    const entity = this.eventRepo.create({
      eventId: event.id,
      proposalId: event.proposalId,
      chainId,
      eventType: event.eventType,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: event.timestamp,
      data: event.data,
    });

    await this.eventRepo.save(entity);
    this.logger.debug(`Persisted event ${event.id}`);
    return entity;
  }

  async searchEvents(
    chainId: number,
    opts: EventSearchOptions = {},
  ): Promise<{ items: ProposalEventEntity[]; total: number }> {
    const qb = this.eventRepo.createQueryBuilder('e').where('e.chainId = :chainId', { chainId });

    if (opts.proposalId) qb.andWhere('e.proposalId = :proposalId', { proposalId: opts.proposalId });
    if (opts.eventType) qb.andWhere('e.eventType = :eventType', { eventType: opts.eventType });
    if (opts.fromBlock) qb.andWhere('e.blockNumber >= :fromBlock', { fromBlock: opts.fromBlock });
    if (opts.toBlock) qb.andWhere('e.blockNumber <= :toBlock', { toBlock: opts.toBlock });
    if (opts.fromDate) qb.andWhere('e.timestamp >= :fromDate', { fromDate: opts.fromDate });
    if (opts.toDate) qb.andWhere('e.timestamp <= :toDate', { toDate: opts.toDate });

    qb.orderBy('e.blockNumber', 'DESC')
      .skip(opts.offset ?? 0)
      .take(opts.limit ?? 100);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getEventsForProposal(proposalId: string, chainId: number): Promise<ProposalEventEntity[]> {
    return this.eventRepo.find({
      where: { proposalId, chainId },
      order: { blockNumber: 'ASC' },
    });
  }

  /**
   * Return the highest block number we've seen for this chain,
   * so the detector knows where to resume on restart.
   */
  async getLastIndexedBlock(chainId: number): Promise<number | null> {
    const result = await this.proposalRepo
      .createQueryBuilder('p')
      .select('MAX(p.blockNumber)', 'maxBlock')
      .where('p.chainId = :chainId', { chainId })
      .getRawOne<{ maxBlock: number | null }>();

    return result?.maxBlock ?? null;
  }
}

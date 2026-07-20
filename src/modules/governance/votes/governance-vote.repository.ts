import { DataSource, Repository } from 'typeorm';
import { VoteOutcomeEntity } from './entities/vote-outcome.entity';
import { VoteAlertEntity } from './entities/vote-alert.entity';
import { CreateVoteOutcomeDto, UpdateVoteOutcomeDto, VoteOutcomeQueryDto } from './dto';
import { Logger } from '../../../utils/logger';

export class GovernanceVoteRepository {
  private voteOutcomeRepo: Repository<VoteOutcomeEntity>;
  private voteAlertRepo: Repository<VoteAlertEntity>;
  private logger: Logger;

  constructor(private dataSource: DataSource) {
    this.voteOutcomeRepo = dataSource.getRepository(VoteOutcomeEntity);
    this.voteAlertRepo = dataSource.getRepository(VoteAlertEntity);
    this.logger = new Logger('GovernanceVoteRepository');
  }

  // ─── Vote Outcomes ───────────────────────────────────────────────────────────────

  async upsertVoteOutcome(dto: CreateVoteOutcomeDto): Promise<VoteOutcomeEntity> {
    const existing = await this.voteOutcomeRepo.findOne({
      where: { proposalId: dto.proposalId, chainId: dto.chainId },
    });

    if (existing) {
      const updateData: UpdateVoteOutcomeDto = {
        outcome: dto.outcome,
        votingEndedAt: dto.votingEndedAt,
        executionTimestamp: dto.executionTimestamp,
        totalVotes: dto.totalVotes,
        yesVotes: dto.yesVotes,
        noVotes: dto.noVotes,
        abstainVotes: dto.abstainVotes,
        vetoVotes: dto.vetoVotes,
        participationPercentage: dto.participationPercentage,
        proposalType: dto.proposalType,
        proposalImpact: dto.proposalImpact,
        previousState: existing.outcome,
      };

      const updated = this.voteOutcomeRepo.merge(existing, updateData);
      await this.voteOutcomeRepo.save(updated);
      this.logger.debug(`Updated vote outcome for proposal ${dto.proposalId}`);
      return updated;
    }

    const entity = this.voteOutcomeRepo.create({
      ...dto,
      processed: false,
    });

    await this.voteOutcomeRepo.save(entity);
    this.logger.info(`Created vote outcome for proposal ${dto.proposalId} (chain ${dto.chainId})`);
    return entity;
  }

  async findVoteOutcome(proposalId: string, chainId: number): Promise<VoteOutcomeEntity | null> {
    return this.voteOutcomeRepo.findOne({
      where: { proposalId, chainId },
    });
  }

  async searchVoteOutcomes(
    query: VoteOutcomeQueryDto,
  ): Promise<{ items: VoteOutcomeEntity[]; total: number }> {
    const qb = this.voteOutcomeRepo.createQueryBuilder('vo');

    if (query.chainId) {
      qb.andWhere('vo.chainId = :chainId', { chainId: query.chainId });
    }
    if (query.proposalId) {
      qb.andWhere('vo.proposalId = :proposalId', { proposalId: query.proposalId });
    }
    if (query.outcome) {
      qb.andWhere('vo.outcome = :outcome', { outcome: query.outcome });
    }
    if (query.proposalType) {
      qb.andWhere('vo.proposalType = :proposalType', { proposalType: query.proposalType });
    }
    if (query.proposalImpact) {
      qb.andWhere('vo.proposalImpact = :proposalImpact', { proposalImpact: query.proposalImpact });
    }
    if (query.fromVotingEndedAt) {
      qb.andWhere('vo.votingEndedAt >= :fromVotingEndedAt', {
        fromVotingEndedAt: query.fromVotingEndedAt,
      });
    }
    if (query.toVotingEndedAt) {
      qb.andWhere('vo.votingEndedAt <= :toVotingEndedAt', {
        toVotingEndedAt: query.toVotingEndedAt,
      });
    }
    if (query.processed !== undefined) {
      qb.andWhere('vo.processed = :processed', { processed: query.processed });
    }

    qb.orderBy('vo.votingEndedAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 50);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getUnprocessedOutcomes(chainId?: number): Promise<VoteOutcomeEntity[]> {
    const qb = this.voteOutcomeRepo
      .createQueryBuilder('vo')
      .where('vo.processed = :processed', { processed: false });

    if (chainId) {
      qb.andWhere('vo.chainId = :chainId', { chainId });
    }

    return qb.getMany();
  }

  async markAsProcessed(proposalId: string, chainId: number): Promise<void> {
    await this.voteOutcomeRepo.update({ proposalId, chainId }, { processed: true });
    this.logger.debug(`Marked proposal ${proposalId} as processed`);
  }

  async updateVoteOutcome(
    proposalId: string,
    chainId: number,
    updateData: UpdateVoteOutcomeDto,
  ): Promise<void> {
    await this.voteOutcomeRepo.update(
      { proposalId, chainId },
      { ...updateData, updatedAt: new Date() },
    );
    this.logger.debug(`Updated vote outcome for proposal ${proposalId}`);
  }

  // ─── Vote Alerts ───────────────────────────────────────────────────────────────────

  async createAlert(dto: {
    proposalId: string;
    chainId: number;
    proposalTitle: string;
    alertType: string;
    severity: string;
    outcome?: string;
    message: string;
    proposalLink?: string;
    network?: string;
    metadata?: Record<string, unknown>;
  }): Promise<VoteAlertEntity> {
    const entity = this.voteAlertRepo.create({
      ...dto,
      notified: false,
    });

    await this.voteAlertRepo.save(entity);
    this.logger.info(`Created alert for proposal ${dto.proposalId}: ${dto.alertType}`);
    return entity;
  }

  async findUnnotifiedAlerts(chainId?: number): Promise<VoteAlertEntity[]> {
    const qb = this.voteAlertRepo
      .createQueryBuilder('va')
      .where('va.notified = :notified', { notified: false });

    if (chainId) {
      qb.andWhere('va.chainId = :chainId', { chainId });
    }

    return qb.orderBy('va.createdAt', 'ASC').getMany();
  }

  async markAlertAsNotified(alertId: string): Promise<void> {
    await this.voteAlertRepo.update(
      { id: alertId },
      { notified: true, notificationSentAt: new Date() },
    );
    this.logger.debug(`Marked alert ${alertId} as notified`);
  }

  async searchAlerts(
    chainId?: number,
    proposalId?: string,
    alertType?: string,
    limit: number = 100,
  ): Promise<VoteAlertEntity[]> {
    const qb = this.voteAlertRepo.createQueryBuilder('va');

    if (chainId) {
      qb.andWhere('va.chainId = :chainId', { chainId });
    }
    if (proposalId) {
      qb.andWhere('va.proposalId = :proposalId', { proposalId });
    }
    if (alertType) {
      qb.andWhere('va.alertType = :alertType', { alertType });
    }

    return qb.orderBy('va.createdAt', 'DESC').limit(limit).getMany();
  }

  async getAlertsForProposal(proposalId: string, chainId: number): Promise<VoteAlertEntity[]> {
    return this.voteAlertRepo.find({
      where: { proposalId, chainId },
      order: { createdAt: 'ASC' },
    });
  }
}

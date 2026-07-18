import { DataSource, Repository } from 'typeorm';
import { TreasuryPolicyEntity } from './entities/treasury-policy.entity';
import { PolicyViolationEntity } from './entities/policy-violation.entity';
import { PolicyAuditLogEntity } from './entities/policy-audit-log.entity';
import {
  CreateTreasuryPolicyDto,
  UpdateTreasuryPolicyDto,
  TreasuryPolicyQueryDto,
  CreateViolationDto,
  ViolationQueryDto,
} from './dto';
import { Logger } from '../../../utils/logger';

export class TreasuryPolicyRepository {
  private policyRepo: Repository<TreasuryPolicyEntity>;
  private violationRepo: Repository<PolicyViolationEntity>;
  private auditLogRepo: Repository<PolicyAuditLogEntity>;
  private logger: Logger;

  constructor(private dataSource: DataSource) {
    this.policyRepo = dataSource.getRepository(TreasuryPolicyEntity);
    this.violationRepo = dataSource.getRepository(PolicyViolationEntity);
    this.auditLogRepo = dataSource.getRepository(PolicyAuditLogEntity);
    this.logger = new Logger('TreasuryPolicyRepository');
  }

  // ─── Policy Operations ───────────────────────────────────────────────────────────────

  async createPolicy(dto: CreateTreasuryPolicyDto): Promise<TreasuryPolicyEntity> {
    const policy = this.policyRepo.create(dto);
    return this.policyRepo.save(policy);
  }

  async updatePolicy(
    id: string,
    dto: UpdateTreasuryPolicyDto,
  ): Promise<TreasuryPolicyEntity | null> {
    await this.policyRepo.update(id, dto);
    return this.policyRepo.findOne({ where: { id } });
  }

  async deletePolicy(id: string): Promise<boolean> {
    const result = await this.policyRepo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async getPolicyById(id: string): Promise<TreasuryPolicyEntity | null> {
    return this.policyRepo.findOne({ where: { id } });
  }

  async getPolicies(
    query: TreasuryPolicyQueryDto,
  ): Promise<{ items: TreasuryPolicyEntity[]; total: number }> {
    const qb = this.policyRepo.createQueryBuilder('tp');

    if (query.walletAddress) {
      qb.andWhere('tp.walletAddress = :walletAddress', { walletAddress: query.walletAddress });
    }
    if (query.chainId) {
      qb.andWhere('tp.chainId = :chainId', { chainId: query.chainId });
    }
    if (query.policyType) {
      qb.andWhere('tp.policyType = :policyType', { policyType: query.policyType });
    }
    if (query.status) {
      qb.andWhere('tp.status = :status', { status: query.status });
    }

    qb.orderBy('tp.createdAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 50);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getActivePolicies(walletAddress: string, chainId: number): Promise<TreasuryPolicyEntity[]> {
    return this.policyRepo.find({
      where: {
        walletAddress,
        chainId,
        status: 'ENABLED',
      },
    });
  }

  async getActivePoliciesByChain(chainId: number): Promise<TreasuryPolicyEntity[]> {
    return this.policyRepo.find({
      where: {
        chainId,
        status: 'ENABLED',
      },
    });
  }

  // ─── Violation Operations ─────────────────────────────────────────────────────────────

  async createViolation(dto: CreateViolationDto): Promise<PolicyViolationEntity> {
    const existing = await this.violationRepo.findOne({
      where: {
        transactionHash: dto.transactionHash,
        policyId: dto.policyId,
      },
    });

    if (existing) {
      this.logger.debug(`Violation already exists for transaction ${dto.transactionHash}`);
      return existing;
    }

    const violation = this.violationRepo.create(dto);
    return this.violationRepo.save(violation);
  }

  async getViolationById(id: string): Promise<PolicyViolationEntity | null> {
    return this.violationRepo.findOne({ where: { id } });
  }

  async getViolations(
    query: ViolationQueryDto,
  ): Promise<{ items: PolicyViolationEntity[]; total: number }> {
    const qb = this.violationRepo.createQueryBuilder('pv');

    if (query.policyId) {
      qb.andWhere('pv.policyId = :policyId', { policyId: query.policyId });
    }
    if (query.walletAddress) {
      qb.andWhere('pv.walletAddress = :walletAddress', { walletAddress: query.walletAddress });
    }
    if (query.chainId) {
      qb.andWhere('pv.chainId = :chainId', { chainId: query.chainId });
    }
    if (query.transactionHash) {
      qb.andWhere('pv.transactionHash = :transactionHash', {
        transactionHash: query.transactionHash,
      });
    }
    if (query.status) {
      qb.andWhere('pv.status = :status', { status: query.status });
    }
    if (query.severity) {
      qb.andWhere('pv.severity = :severity', { severity: query.severity });
    }
    if (query.fromDate) {
      qb.andWhere('pv.createdAt >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('pv.createdAt <= :toDate', { toDate: query.toDate });
    }

    qb.orderBy('pv.createdAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 50);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getUnsentAlerts(): Promise<PolicyViolationEntity[]> {
    return this.violationRepo.find({
      where: { alertSent: false },
      take: 100,
    });
  }

  async markAlertSent(violationId: string): Promise<void> {
    await this.violationRepo.update(violationId, {
      alertSent: true,
      alertSentAt: new Date(),
    });
  }

  async updateViolationStatus(
    id: string,
    status: string,
    acknowledgedBy?: string,
    resolvedBy?: string,
    resolutionNotes?: string,
  ): Promise<void> {
    const updateData: any = { status };
    if (acknowledgedBy) {
      updateData.acknowledgedBy = acknowledgedBy;
      updateData.acknowledgedAt = new Date();
    }
    if (resolvedBy) {
      updateData.resolvedBy = resolvedBy;
      updateData.resolvedAt = new Date();
    }
    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    await this.violationRepo.update(id, updateData);
  }

  // ─── Audit Log Operations ─────────────────────────────────────────────────────────────

  async createAuditLog(
    policyId: string,
    action: string,
    performedBy: string,
    changes?: Record<string, unknown>,
    previousState?: Record<string, unknown>,
    newState?: Record<string, unknown>,
    reason?: string,
  ): Promise<PolicyAuditLogEntity> {
    const auditLog = this.auditLogRepo.create({
      policyId,
      action,
      performedBy,
      changes,
      previousState,
      newState,
      reason,
    });
    return this.auditLogRepo.save(auditLog);
  }

  async getAuditLogs(policyId: string, limit = 50): Promise<PolicyAuditLogEntity[]> {
    return this.auditLogRepo.find({
      where: { policyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

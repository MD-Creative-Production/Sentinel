import { Logger } from '../../../utils/logger';
import { TreasuryPolicyRepository } from './treasury-policy.repository';
import { TreasuryPolicyValidator } from './treasury-policy.validator';
import { TreasuryPolicyEngine } from './treasury-policy.engine';
import { PolicyEvaluationResult } from './interfaces';
import { TransactionData } from './interfaces/transaction-data.interface';
import { ITreasuryPolicyService } from './interfaces/treasury-policy-service.interface';
import {
  CreateTreasuryPolicyDto,
  UpdateTreasuryPolicyDto,
  TreasuryPolicyQueryDto,
  ViolationQueryDto,
} from './dto';
import { TreasuryPolicyEntity } from './entities/treasury-policy.entity';

export class TreasuryPolicyService implements ITreasuryPolicyService {
  private logger: Logger;
  private validator: TreasuryPolicyValidator;
  private engine: TreasuryPolicyEngine;

  constructor(private policyRepository: TreasuryPolicyRepository) {
    this.logger = new Logger('TreasuryPolicyService');
    this.validator = new TreasuryPolicyValidator();
    this.engine = new TreasuryPolicyEngine();
  }

  async evaluateTransaction(transaction: TransactionData): Promise<PolicyEvaluationResult[]> {
    this.logger.debug(`Evaluating transaction ${transaction.hash} for wallet ${transaction.from}`);

    const policies = await this.policyRepository.getActivePolicies(transaction.from, transaction.chainId);

    if (policies.length === 0) {
      this.logger.debug(`No active policies found for wallet ${transaction.from}`);
      return [];
    }

    const results = await this.engine.evaluateAll(transaction, policies);

    for (const result of results) {
      if (result.violated) {
        await this.createViolationFromResult(result, transaction);
      }
    }

    return results;
  }

  async evaluatePoliciesForWallet(walletAddress: string, chainId: number): Promise<PolicyEvaluationResult[]> {
    this.logger.debug(`Evaluating policies for wallet ${walletAddress} on chain ${chainId}`);

    const policies = await this.policyRepository.getActivePolicies(walletAddress, chainId);

    if (policies.length === 0) {
      return [];
    }

    const results: PolicyEvaluationResult[] = [];

    for (const policy of policies) {
      const result: PolicyEvaluationResult = {
        policyId: policy.id,
        policyName: policy.policyName,
        walletAddress: policy.walletAddress,
        chainId: policy.chainId,
        transactionHash: 'N/A',
        violated: false,
      };
      results.push(result);
    }

    return results;
  }

  async getActivePolicies(walletAddress: string, chainId: number): Promise<TreasuryPolicyEntity[]> {
    return this.policyRepository.getActivePolicies(walletAddress, chainId);
  }

  async createPolicy(dto: CreateTreasuryPolicyDto, createdBy?: string): Promise<TreasuryPolicyEntity> {
    const validation = this.validator.validateCreatePolicyDto(dto);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const thresholdConfigValidation = this.validator.validateThresholdConfig(dto.thresholdConfig);
    if (!thresholdConfigValidation.valid) {
      throw new Error(`Threshold config validation failed: ${thresholdConfigValidation.errors.join(', ')}`);
    }

    const policy = await this.policyRepository.createPolicy(dto);

    if (createdBy) {
      await this.policyRepository.createAuditLog(
        policy.id,
        'CREATE',
        createdBy,
        undefined,
        undefined,
        dto as unknown as Record<string, unknown>,
        'Policy created',
      );
    }

    this.logger.info(`Created policy ${policy.policyName} for wallet ${policy.walletAddress}`);
    return policy;
  }

  async updatePolicy(
    id: string,
    dto: UpdateTreasuryPolicyDto,
    updatedBy?: string,
    reason?: string,
  ): Promise<TreasuryPolicyEntity | null> {
    const validation = this.validator.validateUpdatePolicyDto(dto);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const existingPolicy = await this.policyRepository.getPolicyById(id);
    if (!existingPolicy) {
      throw new Error('Policy not found');
    }

    const updatedPolicy = await this.policyRepository.updatePolicy(id, dto);

    if (updatedBy && updatedPolicy) {
      await this.policyRepository.createAuditLog(
        id,
        'UPDATE',
        updatedBy,
        dto as unknown as Record<string, unknown>,
        existingPolicy as unknown as Record<string, unknown>,
        updatedPolicy as unknown as Record<string, unknown>,
        reason,
      );
    }

    this.logger.info(`Updated policy ${existingPolicy.policyName}`);
    return updatedPolicy;
  }

  async deletePolicy(id: string, deletedBy?: string, reason?: string): Promise<boolean> {
    const existingPolicy = await this.policyRepository.getPolicyById(id);
    if (!existingPolicy) {
      throw new Error('Policy not found');
    }

    const result = await this.policyRepository.deletePolicy(id);

    if (deletedBy) {
      await this.policyRepository.createAuditLog(
        id,
        'DELETE',
        deletedBy,
        undefined,
        existingPolicy as unknown as Record<string, unknown>,
        undefined,
        reason,
      );
    }

    this.logger.info(`Deleted policy ${existingPolicy.policyName}`);
    return result;
  }

  async getPolicyById(id: string): Promise<TreasuryPolicyEntity | null> {
    return this.policyRepository.getPolicyById(id);
  }

  async getPolicies(query: TreasuryPolicyQueryDto): Promise<{ items: TreasuryPolicyEntity[]; total: number }> {
    return this.policyRepository.getPolicies(query);
  }

  async getViolations(query: ViolationQueryDto): Promise<{ items: any[]; total: number }> {
    return this.policyRepository.getViolations(query);
  }

  async acknowledgeViolation(id: string, acknowledgedBy: string): Promise<void> {
    await this.policyRepository.updateViolationStatus(id, 'ACKNOWLEDGED', acknowledgedBy);
    this.logger.info(`Acknowledged violation ${id}`);
  }

  async resolveViolation(id: string, resolvedBy: string, notes?: string): Promise<void> {
    await this.policyRepository.updateViolationStatus(id, 'RESOLVED', undefined, resolvedBy, notes);
    this.logger.info(`Resolved violation ${id}`);
  }

  async markAsFalsePositive(id: string, resolvedBy: string, notes?: string): Promise<void> {
    await this.policyRepository.updateViolationStatus(id, 'FALSE_POSITIVE', undefined, resolvedBy, notes);
    this.logger.info(`Marked violation ${id} as false positive`);
  }

  async getAuditLogs(policyId: string, limit = 50): Promise<any[]> {
    return this.policyRepository.getAuditLogs(policyId, limit);
  }

  private async createViolationFromResult(result: PolicyEvaluationResult, transaction: TransactionData): Promise<void> {
    const violationDto = {
      policyId: result.policyId,
      policyName: result.policyName,
      walletAddress: result.walletAddress,
      chainId: result.chainId,
      transactionHash: result.transactionHash,
      transactionBlock: transaction.blockNumber.toString(),
      violatedRule: result.violatedRule || '',
      thresholdValue: result.thresholdValue || '0',
      observedValue: result.observedValue || '0',
      transactionAmount: transaction.value,
      recipientAddress: transaction.to,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      severity: (result.severity || 'HIGH') as any,
      status: 'ACTIVE' as any,
      recommendedAction: result.recommendedAction,
      contextData: result.contextData,
    };

    await this.policyRepository.createViolation(violationDto);
    this.logger.info(`Created violation for policy ${result.policyName}`);
  }
}

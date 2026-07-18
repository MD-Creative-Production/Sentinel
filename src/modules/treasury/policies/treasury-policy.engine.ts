import { Logger } from '../../../utils/logger';
import { PolicyEvaluationResult } from './interfaces';
import { TransactionData } from './interfaces/transaction-data.interface';
import { ITreasuryPolicyEngine } from './interfaces/treasury-policy-service.interface';
import { PolicyType, AlertSeverity } from './enums';
import { TreasuryPolicyEntity } from './entities/treasury-policy.entity';

export class TreasuryPolicyEngine implements ITreasuryPolicyEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TreasuryPolicyEngine');
  }

  async evaluate(transaction: TransactionData, policy: TreasuryPolicyEntity): Promise<PolicyEvaluationResult> {
    this.logger.debug(`Evaluating policy ${policy.policyName} for transaction ${transaction.hash}`);

    const result: PolicyEvaluationResult = {
      policyId: policy.id,
      policyName: policy.policyName,
      walletAddress: policy.walletAddress,
      chainId: policy.chainId,
      transactionHash: transaction.hash,
      violated: false,
    };

    try {
      switch (policy.policyType) {
        case PolicyType.MaxTransactionAmount:
          await this.evaluateMaxTransactionAmount(transaction, policy, result);
          break;
        case PolicyType.DailyTransferLimit:
          await this.evaluateDailyTransferLimit(transaction, policy, result);
          break;
        case PolicyType.HourlyTransferLimit:
          await this.evaluateHourlyTransferLimit(transaction, policy, result);
          break;
        case PolicyType.MaxTransactionCount:
          await this.evaluateMaxTransactionCount(transaction, policy, result);
          break;
        case PolicyType.BalancePercentageTransfer:
          await this.evaluateBalancePercentageTransfer(transaction, policy, result);
          break;
        case PolicyType.UnauthorizedDestination:
          await this.evaluateUnauthorizedDestination(transaction, policy, result);
          break;
        case PolicyType.LargeBalanceDecrease:
          await this.evaluateLargeBalanceDecrease(transaction, policy, result);
          break;
        case PolicyType.HighFrequencyTransfers:
          await this.evaluateHighFrequencyTransfers(transaction, policy, result);
          break;
        case PolicyType.FirstTimeRecipient:
          await this.evaluateFirstTimeRecipient(transaction, policy, result);
          break;
        case PolicyType.BusinessHoursOnly:
          await this.evaluateBusinessHoursOnly(transaction, policy, result);
          break;
        case PolicyType.MinBalanceThreshold:
          await this.evaluateMinBalanceThreshold(transaction, policy, result);
          break;
        default:
          this.logger.warn(`Unknown policy type: ${policy.policyType}`);
      }
    } catch (error) {
      this.logger.error(`Error evaluating policy ${policy.policyName}`, error);
      result.violated = false;
    }

    return result;
  }

  async evaluateAll(transaction: TransactionData, policies: TreasuryPolicyEntity[]): Promise<PolicyEvaluationResult[]> {
    this.logger.debug(`Evaluating ${policies.length} policies for transaction ${transaction.hash}`);

    const results: PolicyEvaluationResult[] = [];

    for (const policy of policies) {
      try {
        const result = await this.evaluate(transaction, policy);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to evaluate policy ${policy.policyName}`, error);
      }
    }

    return results;
  }

  private async evaluateMaxTransactionAmount(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = BigInt(policy.thresholdValue);
    const transactionValue = BigInt(transaction.value);

    if (transactionValue > threshold) {
      result.violated = true;
      result.violatedRule = 'MAX_TRANSACTION_AMOUNT';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = transaction.value;
      result.severity = policy.severity;
      result.recommendedAction = 'Review and approve transaction manually';
    }
  }

  private async evaluateDailyTransferLimit(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = BigInt(policy.thresholdValue);
    const timeWindow = policy.thresholdConfig?.timeWindow as number | undefined;
    const hours = timeWindow || 24;

    const dailyTotal = await this.calculateTotalTransfersInWindow(
      policy.walletAddress,
      policy.chainId,
      hours,
    );

    if (dailyTotal > threshold) {
      result.violated = true;
      result.violatedRule = 'DAILY_TRANSFER_LIMIT';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = dailyTotal.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Pause transfers and review daily activity';
      result.contextData = { timeWindowHours: hours };
    }
  }

  private async evaluateHourlyTransferLimit(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = BigInt(policy.thresholdValue);
    const hourlyTotal = await this.calculateTotalTransfersInWindow(policy.walletAddress, policy.chainId, 1);

    if (hourlyTotal > threshold) {
      result.violated = true;
      result.violatedRule = 'HOURLY_TRANSFER_LIMIT';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = hourlyTotal.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Pause transfers and review hourly activity';
    }
  }

  private async evaluateMaxTransactionCount(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = parseInt(policy.thresholdValue, 10);
    const timeWindow = policy.thresholdConfig?.timeWindow as number | undefined;
    const hours = timeWindow || 24;

    const transactionCount = await this.countTransactionsInWindow(policy.walletAddress, policy.chainId, hours);

    if (transactionCount > threshold) {
      result.violated = true;
      result.violatedRule = 'MAX_TRANSACTION_COUNT';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = transactionCount.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Review transaction velocity and consider rate limiting';
      result.contextData = { timeWindowHours: hours };
    }
  }

  private async evaluateBalancePercentageTransfer(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = parseFloat(policy.thresholdValue);
    const transactionValue = BigInt(transaction.value);
    const balanceBefore = transaction.balanceBefore ? BigInt(transaction.balanceBefore) : BigInt(0);

    if (balanceBefore === BigInt(0)) {
      return;
    }

    const percentage = (Number(transactionValue) / Number(balanceBefore)) * 100;

    if (percentage > threshold) {
      result.violated = true;
      result.violatedRule = 'BALANCE_PERCENTAGE_TRANSFER';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = percentage.toFixed(2);
      result.severity = policy.severity;
      result.recommendedAction = 'Review large balance transfer and confirm authorization';
    }
  }

  private async evaluateUnauthorizedDestination(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const approvedAddresses = policy.approvedAddresses || [];

    if (!approvedAddresses.includes(transaction.to.toLowerCase())) {
      result.violated = true;
      result.violatedRule = 'UNAUTHORIZED_DESTINATION';
      result.thresholdValue = 'Approved addresses only';
      result.observedValue = transaction.to;
      result.severity = AlertSeverity.Critical;
      result.recommendedAction = 'Block transaction and investigate recipient';
      result.contextData = { recipientAddress: transaction.to };
    }
  }

  private async evaluateLargeBalanceDecrease(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = BigInt(policy.thresholdValue);
    const balanceBefore = transaction.balanceBefore ? BigInt(transaction.balanceBefore) : BigInt(0);
    const balanceAfter = transaction.balanceAfter ? BigInt(transaction.balanceAfter) : BigInt(0);

    if (balanceBefore === BigInt(0)) {
      return;
    }

    const decrease = balanceBefore - balanceAfter;

    if (decrease > threshold) {
      result.violated = true;
      result.violatedRule = 'LARGE_BALANCE_DECREASE';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = decrease.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Investigate large balance decrease immediately';
    }
  }

  private async evaluateHighFrequencyTransfers(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = parseInt(policy.thresholdValue, 10);
    const timeWindow = policy.thresholdConfig?.timeWindow as number | undefined;
    const minutes = timeWindow || 60;

    const transactionCount = await this.countTransactionsInWindow(policy.walletAddress, policy.chainId, minutes / 60);

    if (transactionCount > threshold) {
      result.violated = true;
      result.violatedRule = 'HIGH_FREQUENCY_TRANSFERS';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = transactionCount.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Investigate high-frequency transfer pattern';
      result.contextData = { timeWindowMinutes: minutes };
    }
  }

  private async evaluateFirstTimeRecipient(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const isFirstTime = await this.isFirstTimeRecipient(policy.walletAddress, transaction.to, policy.chainId);

    if (isFirstTime) {
      result.violated = true;
      result.violatedRule = 'FIRST_TIME_RECIPIENT';
      result.thresholdValue = 'Known recipients only';
      result.observedValue = transaction.to;
      result.severity = AlertSeverity.Medium;
      result.recommendedAction = 'Review first-time recipient transaction';
      result.contextData = { recipientAddress: transaction.to };
    }
  }

  private async evaluateBusinessHoursOnly(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    if (!policy.businessHoursStart || !policy.businessHoursEnd || !policy.timeZone) {
      return;
    }

    const transactionTime = transaction.timestamp;
    const isBusinessHours = this.isWithinBusinessHours(transactionTime, policy.businessHoursStart, policy.businessHoursEnd, policy.timeZone);

    if (!isBusinessHours) {
      result.violated = true;
      result.violatedRule = 'BUSINESS_HOURS_ONLY';
      result.thresholdValue = `${policy.businessHoursStart} - ${policy.businessHoursEnd} ${policy.timeZone}`;
      result.observedValue = transactionTime.toISOString();
      result.severity = AlertSeverity.Medium;
      result.recommendedAction = 'Review transaction outside business hours';
      result.contextData = { transactionTime: transactionTime.toISOString(), timeZone: policy.timeZone };
    }
  }

  private async evaluateMinBalanceThreshold(
    transaction: TransactionData,
    policy: TreasuryPolicyEntity,
    result: PolicyEvaluationResult,
  ): Promise<void> {
    const threshold = BigInt(policy.thresholdValue);
    const balanceAfter = transaction.balanceAfter ? BigInt(transaction.balanceAfter) : BigInt(0);

    if (balanceAfter < threshold) {
      result.violated = true;
      result.violatedRule = 'MIN_BALANCE_THRESHOLD';
      result.thresholdValue = policy.thresholdValue;
      result.observedValue = balanceAfter.toString();
      result.severity = policy.severity;
      result.recommendedAction = 'Review low balance and consider replenishment';
    }
  }

  private async calculateTotalTransfersInWindow(walletAddress: string, chainId: number, hours: number): Promise<bigint> {
    return BigInt(0);
  }

  private async countTransactionsInWindow(walletAddress: string, chainId: number, hours: number): Promise<number> {
    return 0;
  }

  private async isFirstTimeRecipient(walletAddress: string, recipient: string, chainId: number): Promise<boolean> {
    return true;
  }

  private isWithinBusinessHours(
    transactionTime: Date,
    startTime: string,
    endTime: string,
    timeZone: string,
  ): boolean {
    return true;
  }
}

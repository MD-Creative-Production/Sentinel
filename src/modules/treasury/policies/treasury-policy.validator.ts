import { CreateTreasuryPolicyDto, UpdateTreasuryPolicyDto } from './dto';
import { PolicyType, ThresholdType } from './enums';
import { Logger } from '../../../utils/logger';

export class TreasuryPolicyValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TreasuryPolicyValidator');
  }

  validateCreatePolicyDto(dto: CreateTreasuryPolicyDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.policyName || dto.policyName.trim().length === 0) {
      errors.push('Policy name is required');
    }

    if (!dto.walletAddress || !this.isValidAddress(dto.walletAddress)) {
      errors.push('Invalid wallet address');
    }

    if (!dto.chainId || dto.chainId <= 0) {
      errors.push('Invalid chain ID');
    }

    if (!dto.policyType) {
      errors.push('Policy type is required');
    }

    if (!dto.thresholdType) {
      errors.push('Threshold type is required');
    }

    if (!dto.thresholdValue || dto.thresholdValue.trim().length === 0) {
      errors.push('Threshold value is required');
    } else {
      const thresholdNum = parseFloat(dto.thresholdValue);
      if (isNaN(thresholdNum) || thresholdNum < 0) {
        errors.push('Threshold value must be a positive number');
      }
    }

    const validationErrors = this.validatePolicyTypeSpecificRules(dto);
    errors.push(...validationErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdatePolicyDto(dto: UpdateTreasuryPolicyDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.thresholdValue !== undefined) {
      const thresholdNum = parseFloat(dto.thresholdValue);
      if (isNaN(thresholdNum) || thresholdNum < 0) {
        errors.push('Threshold value must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validatePolicyTypeSpecificRules(dto: CreateTreasuryPolicyDto): string[] {
    const errors: string[] = [];

    switch (dto.policyType) {
      case PolicyType.UnauthorizedDestination:
        if (!dto.approvedAddresses || dto.approvedAddresses.length === 0) {
          errors.push('Unauthorized destination policy requires at least one approved address');
        }
        break;

      case PolicyType.BusinessHoursOnly:
        if (!dto.businessHoursStart || !dto.businessHoursEnd) {
          errors.push('Business hours policy requires start and end times');
        }
        if (!dto.timeZone) {
          errors.push('Business hours policy requires time zone');
        }
        break;

      case PolicyType.DailyTransferLimit:
      case PolicyType.HourlyTransferLimit:
      case PolicyType.MaxTransactionCount:
        if (
          dto.thresholdType !== ThresholdType.Count &&
          dto.thresholdType !== ThresholdType.FixedAmount
        ) {
          errors.push(`${dto.policyType} requires threshold type of Count or FixedAmount`);
        }
        break;

      case PolicyType.BalancePercentageTransfer:
        if (dto.thresholdType !== ThresholdType.Percentage) {
          errors.push('Balance percentage transfer requires threshold type of Percentage');
        }
        const percentage = parseFloat(dto.thresholdValue);
        if (percentage > 100) {
          errors.push('Percentage threshold cannot exceed 100');
        }
        break;

      case PolicyType.MaxTransactionAmount:
      case PolicyType.LargeBalanceDecrease:
      case PolicyType.MinBalanceThreshold:
        if (dto.thresholdType !== ThresholdType.FixedAmount) {
          errors.push(`${dto.policyType} requires threshold type of FixedAmount`);
        }
        break;
    }

    return errors;
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  validateThresholdConfig(config: Record<string, unknown> | undefined): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config) {
      return { valid: true, errors };
    }

    if (config.timeWindow !== undefined) {
      const timeWindow = Number(config.timeWindow);
      if (isNaN(timeWindow) || timeWindow <= 0) {
        errors.push('Time window must be a positive number');
      }
    }

    if (config.riskScore !== undefined) {
      const riskScore = Number(config.riskScore);
      if (isNaN(riskScore) || riskScore < 0 || riskScore > 100) {
        errors.push('Risk score must be between 0 and 100');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

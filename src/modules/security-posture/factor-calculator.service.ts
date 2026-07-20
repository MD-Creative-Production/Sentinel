import { Injectable } from '@nestjs/common';
import { AssetDrainDetector } from './utils/asset-drain.detector';
import { AssetTransferEvent } from './interfaces/asset-drain.interface';
import { FactorInputMetrics } from './interfaces/posture-factor.interface';

@Injectable()
export class FactorCalculatorService {
  constructor(private readonly drainDetector: AssetDrainDetector) {}

  /**
   * Resolves transfer streams into unified factor metrics readable by the scoring engine
   */
  public compileAssetDrainMetrics(
    transfers: AssetTransferEvent[],
    currentTreasuryBalance: number,
  ): FactorInputMetrics {
    const assessment = this.drainDetector.evaluateOutflows(transfers, currentTreasuryBalance);

    return {
      factorId: 'rapid_asset_drain',
      rawCount: assessment.isDraining ? 1 : 0,
      severityMultiplier: assessment.deductionScore, // Directly injects dynamic deduction severity
    };
  }
}

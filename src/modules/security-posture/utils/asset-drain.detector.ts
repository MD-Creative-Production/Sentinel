// src/modules/security-posture/utils/asset-drain.detector.ts
import { Injectable } from '@nestjs/common';
import { AssetRiskSeverity } from '../enums/asset-risk.enum';
import { AssetTransferEvent, DrainageEvaluationResult } from '../interfaces/asset-drain.interface';

@Injectable()
export class AssetDrainDetector {
  // Configurations for rapid draining thresholds
  private readonly DETECTION_WINDOW_MS = 5 * 60 * 1000; // 5-minute rolling window
  private readonly CRITICAL_VALUE_THRESHOLD_USD = 50000; // $50k outflow drops within window triggers alarm

  /**
   * Processes transfer events deterministically to identify rapid draining anomalies.
   */
  public evaluateOutflows(
    transfers: AssetTransferEvent[],
    startingTreasuryValueUsd: number,
  ): DrainageEvaluationResult {
    const now = Date.now();
    const activeWindowStart = now - this.DETECTION_WINDOW_MS;

    // Filter outflows that occurred strictly within the active evaluation window
    const recentTransfers = transfers.filter(
      t => new Date(t.timestamp).getTime() >= activeWindowStart,
    );

    const totalValueLostUsd = recentTransfers.reduce((sum, t) => sum + t.usdValue, 0);
    const percentageDrop =
      startingTreasuryValueUsd > 0 ? (totalValueLostUsd / startingTreasuryValueUsd) * 100 : 0;

    // Trigger classification thresholds
    const isDraining =
      totalValueLostUsd >= this.CRITICAL_VALUE_THRESHOLD_USD || percentageDrop >= 20;

    let severity = AssetRiskSeverity.LOW;
    let deductionScore = 0;

    if (isDraining) {
      if (percentageDrop >= 50 || totalValueLostUsd >= 250000) {
        severity = AssetRiskSeverity.CRITICAL;
        deductionScore = 40; // Max penalty contribution to security posture
      } else {
        severity = AssetRiskSeverity.HIGH;
        deductionScore = 25;
      }
    } else if (totalValueLostUsd > this.CRITICAL_VALUE_THRESHOLD_USD * 0.5) {
      severity = AssetRiskSeverity.MEDIUM;
      deductionScore = 10;
    }

    return {
      isDraining,
      severity,
      totalValueLostUsd,
      percentageDrop: Math.round(percentageDrop * 100) / 100,
      deductionScore,
    };
  }
}

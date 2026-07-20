import { Injectable, Logger } from '@nestjs/common';
import {
  ScoringFactorConfig,
  FactorInputMetrics,
  PostureScoreBreakdown,
  FactorResult,
} from './interfaces/posture-factor.interface';

@Injectable()
export class PostureScoreEngine {
  private readonly logger = new Logger(PostureScoreEngine.name);
  private readonly ENGINE_VERSION = '1.0.0';

  /**
   * Calculates a normalized 0-100 score given inputs and configurations.
   * Logic handles missing telemetry gracefully without failing the entire cycle.
   */
  public calculateScore(
    organizationId: string,
    configs: ScoringFactorConfig[],
    metrics: FactorInputMetrics[],
  ): PostureScoreBreakdown {
    let totalDeductions = 0;
    const factorBreakdowns: FactorResult[] = [];

    // Map metrics for fast lookup
    const metricMap = new Map(metrics.map(m => [m.factorId, m]));

    for (const config of configs) {
      if (!config.enabled) continue;

      try {
        const metric = metricMap.get(config.factorId) || { rawCount: 0, severityMultiplier: 1 };

        // Deduction formula: raw occurrences multiplied by severity impact
        const rawDeduction = metric.rawCount * metric.severityMultiplier;

        // Apply weight configuration and enforce the maximum contribution cap
        const weightedDeduction = Math.min(rawDeduction * config.weight, config.maxContribution);

        totalDeductions += weightedDeduction;

        factorBreakdowns.push({
          factorId: config.factorId,
          name: config.name,
          rawDeduction,
          weightedDeduction,
        });
      } catch (error) {
        this.logger.error(
          `Failed to process score factor [${config.factorId}] for org ${organizationId}:`,
          error,
        );
        // Fault isolation: continue tracking remaining metrics
      }
    }

    // Normalize final output strictly between 0 and 100
    const overallScore = Math.max(0, Math.min(100, 100 - totalDeductions));

    return {
      organizationId,
      timestamp: new Date(),
      overallScore: Math.round(overallScore * 100) / 100, // Round to two decimal spots
      factors: factorBreakdowns,
      calculationVersion: this.ENGINE_VERSION,
    };
  }
}

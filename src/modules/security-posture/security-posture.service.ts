// src/modules/security-posture/security-posture.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PostureScoreEngine } from './posture-score.engine';
import {
  PostureScoreBreakdown,
  ScoringFactorConfig,
  FactorInputMetrics,
} from './interfaces/posture-factor.interface';

@Injectable()
export class SecurityPostureService {
  private readonly logger = new Logger(SecurityPostureService.name);
  private readonly ALERT_THRESHOLD = 70; // Triggers notifications when score falls below 70

  constructor(
    private readonly scoreEngine: PostureScoreEngine,
    // Inject prisma or repository reference here
  ) {}

  public async evaluateOrganizationPosture(
    organizationId: string,
    factorConfigs: ScoringFactorConfig[],
    telemetryData: FactorInputMetrics[],
  ): Promise<PostureScoreBreakdown> {
    // 1. Compute score breakdown using the deterministic calculation engine
    const breakdown = this.scoreEngine.calculateScore(organizationId, factorConfigs, telemetryData);

    // 2. Alert integration verification check
    if (breakdown.overallScore < this.ALERT_THRESHOLD) {
      this.triggerScoreDegradationAlert(organizationId, breakdown.overallScore);
    }

    this.logger.log(
      `Successfully completed security posture processing for Org: ${organizationId}. Score: ${breakdown.overallScore}`,
    );
    return breakdown;
  }

  private triggerScoreDegradationAlert(organizationId: string, score: number): void {
    this.logger.warn(
      `ALERT: Organization [${organizationId}] security posture dropped to ${score}. Threshold breached.`,
    );
    // Integration logic for notifying operations or dispatching an alert entry goes here
  }
}

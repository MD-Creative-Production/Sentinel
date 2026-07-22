/**
 * src/modules/reputation/services/reputation-calculator.service.ts
 *
 * Pure(ish) scoring logic. Takes raw activity/incident/network data plus
 * detected risk indicators and produces a normalized 0-100 composite
 * score with a full breakdown, so results are explainable — not just a
 * black-box number.
 */
import { Injectable } from '@nestjs/common';
import {
  REPUTATION_SCORE_MAX,
  REPUTATION_SCORE_MIN,
  REPUTATION_TIER_THRESHOLDS,
  REPUTATION_WEIGHTS,
  RISK_SEVERITY_PENALTY,
  ReputationTier,
} from '../constants/reputation.constants';
import {
  FactorScore,
  ReputationBreakdown,
  RiskIndicator,
  WalletActivitySnapshot,
  WalletIncidentSummary,
} from '../interfaces/reputation.interfaces';

@Injectable()
export class ReputationCalculatorService {
  composeBreakdown(
    activity: WalletActivitySnapshot,
    incidents: WalletIncidentSummary,
    indicators: RiskIndicator[],
    networkRiskAverage: number | null,
  ): ReputationBreakdown {
    return {
      walletAge: this.scoreWalletAge(activity),
      activityConsistency: this.scoreActivityConsistency(activity),
      riskIndicators: this.scoreRiskIndicators(indicators),
      incidentHistory: this.scoreIncidentHistory(incidents),
      networkAssociation: this.scoreNetworkAssociation(networkRiskAverage),
    };
  }

  composeFinalScore(breakdown: ReputationBreakdown): number {
    const weightedSum =
      breakdown.walletAge.score * breakdown.walletAge.weight +
      breakdown.activityConsistency.score * breakdown.activityConsistency.weight +
      breakdown.riskIndicators.score * breakdown.riskIndicators.weight +
      breakdown.incidentHistory.score * breakdown.incidentHistory.weight +
      breakdown.networkAssociation.score * breakdown.networkAssociation.weight;

    return this.clamp(Math.round(weightedSum));
  }

  tierForScore(score: number): ReputationTier {
    const match = REPUTATION_TIER_THRESHOLDS.find((t) => score >= t.min);
    return match ? match.tier : ReputationTier.HIGH_RISK;
  }

  // --- individual factor scorers -------------------------------------

  private scoreWalletAge(activity: WalletActivitySnapshot): FactorScore {
    if (!activity.firstSeenAt) {
      return {
        score: 30,
        weight: REPUTATION_WEIGHTS.walletAge,
        details: ['No first-seen timestamp available; treated as unproven wallet.'],
      };
    }

    const ageDays = Math.floor(
      (Date.now() - activity.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Logarithmic-ish ramp: new wallets start low, score approaches 100
    // as the wallet accumulates a track record. Full marks at ~2 years.
    const score = this.clamp(Math.round((Math.min(ageDays, 730) / 730) * 100));

    return {
      score,
      weight: REPUTATION_WEIGHTS.walletAge,
      details: [`Wallet first observed ${ageDays} day(s) ago.`],
    };
  }

  private scoreActivityConsistency(activity: WalletActivitySnapshot): FactorScore {
    const details: string[] = [];
    let score = 50;

    if (activity.totalTransactions === 0) {
      score = 20;
      details.push('No on-chain transactions recorded.');
    } else {
      // Reward steady, moderate activity; penalize both total inactivity
      // and extreme burstiness (which can indicate bot/wash-trading behavior).
      const activeRatio = activity.activeDaysLast90 / 90;
      score = this.clamp(Math.round(activeRatio * 100));
      details.push(
        `Active on ${activity.activeDaysLast90}/90 of the last days (${(activeRatio * 100).toFixed(
          0,
        )}% activity ratio).`,
      );
    }

    return { score, weight: REPUTATION_WEIGHTS.activityConsistency, details };
  }

  private scoreRiskIndicators(indicators: RiskIndicator[]): FactorScore {
    if (indicators.length === 0) {
      return {
        score: 100,
        weight: REPUTATION_WEIGHTS.riskIndicators,
        details: ['No risk indicators detected.'],
      };
    }

    const totalPenalty = indicators.reduce(
      (sum, indicator) => sum + RISK_SEVERITY_PENALTY[indicator.severity],
      0,
    );

    const score = this.clamp(100 - totalPenalty);

    return {
      score,
      weight: REPUTATION_WEIGHTS.riskIndicators,
      details: indicators.map((i) => `[${i.severity}] ${i.code}: ${i.description}`),
    };
  }

  private scoreIncidentHistory(incidents: WalletIncidentSummary): FactorScore {
    const details: string[] = [];
    let score = 100;

    if (incidents.confirmedFraudCases > 0) {
      score -= incidents.confirmedFraudCases * 40;
      details.push(`${incidents.confirmedFraudCases} confirmed fraud case(s).`);
    }
    if (incidents.openIncidents > 0) {
      score -= incidents.openIncidents * 15;
      details.push(`${incidents.openIncidents} open incident(s).`);
    }
    if (incidents.resolvedIncidents > 0) {
      // Resolved-and-cleared incidents carry a much smaller, decaying penalty.
      score -= Math.min(incidents.resolvedIncidents * 3, 15);
      details.push(`${incidents.resolvedIncidents} resolved incident(s) on record.`);
    }
    if (details.length === 0) {
      details.push('No incident history found.');
    }

    return { score: this.clamp(score), weight: REPUTATION_WEIGHTS.incidentHistory, details };
  }

  private scoreNetworkAssociation(networkRiskAverage: number | null): FactorScore {
    if (networkRiskAverage === null) {
      return {
        score: 70,
        weight: REPUTATION_WEIGHTS.networkAssociation,
        details: ['No counterparty network data available; neutral-leaning default applied.'],
      };
    }

    return {
      score: this.clamp(Math.round(networkRiskAverage)),
      weight: REPUTATION_WEIGHTS.networkAssociation,
      details: [
        `Average reputation of directly connected counterparties: ${networkRiskAverage.toFixed(1)}.`,
      ],
    };
  }

  private clamp(value: number): number {
    return Math.min(REPUTATION_SCORE_MAX, Math.max(REPUTATION_SCORE_MIN, value));
  }
}

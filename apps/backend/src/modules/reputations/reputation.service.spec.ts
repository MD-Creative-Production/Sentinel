import { ReputationCalculatorService } from './services/reputation-calculator.service';
import {
  REPUTATION_SCORE_MAX,
  REPUTATION_SCORE_MIN,
  REPUTATION_WEIGHTS,
  ReputationTier,
  RiskIndicatorSeverity,
} from './constants/reputation.constants';
import { WalletActivitySnapshot, WalletIncidentSummary } from './interfaces/reputation.interfaces';

describe('REPUTATION_WEIGHTS', () => {
  it('sums to exactly 1 so the composite score stays normalized', () => {
    const total = Object.values(REPUTATION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe('ReputationCalculatorService', () => {
  let calculator: ReputationCalculatorService;

  const cleanActivity: WalletActivitySnapshot = {
    walletAddress: '0xClean',
    chainId: 'stellar',
    firstSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 800), // ~2.2 years old
    lastSeenAt: new Date(),
    totalTransactions: 500,
    activeDaysLast90: 60,
    counterpartyAddresses: [],
  };

  const cleanIncidents: WalletIncidentSummary = {
    walletAddress: '0xClean',
    openIncidents: 0,
    resolvedIncidents: 0,
    confirmedFraudCases: 0,
    lastIncidentAt: null,
  };

  beforeEach(() => {
    calculator = new ReputationCalculatorService();
  });

  it('produces a high score and TRUSTED tier for a clean, established wallet', () => {
    const breakdown = calculator.composeBreakdown(cleanActivity, cleanIncidents, [], null);
    const score = calculator.composeFinalScore(breakdown);

    expect(score).toBeGreaterThanOrEqual(75);
    expect(calculator.tierForScore(score)).toBe(ReputationTier.TRUSTED);
  });

  it('heavily penalizes a wallet with a confirmed fraud case, regardless of age', () => {
    const fraudIncidents: WalletIncidentSummary = {
      ...cleanIncidents,
      confirmedFraudCases: 1,
    };
    const indicators = [
      {
        code: 'CONFIRMED_FRAUD_HISTORY',
        description: 'test',
        severity: RiskIndicatorSeverity.CRITICAL,
        detectedAt: new Date(),
      },
    ];

    const breakdown = calculator.composeBreakdown(
      cleanActivity,
      fraudIncidents,
      indicators,
      null,
    );
    const score = calculator.composeFinalScore(breakdown);

    expect(score).toBeLessThan(50);
    expect([ReputationTier.SUSPICIOUS, ReputationTier.HIGH_RISK]).toContain(
      calculator.tierForScore(score),
    );
  });

  it('never produces a score outside the [0, 100] bounds', () => {
    const worstActivity: WalletActivitySnapshot = {
      ...cleanActivity,
      firstSeenAt: new Date(),
      totalTransactions: 0,
      activeDaysLast90: 0,
    };
    const worstIncidents: WalletIncidentSummary = {
      ...cleanIncidents,
      confirmedFraudCases: 10,
      openIncidents: 10,
    };
    const manyIndicators = Array.from({ length: 10 }, () => ({
      code: 'SANCTIONED_LIST_MATCH',
      description: 'test',
      severity: RiskIndicatorSeverity.CRITICAL,
      detectedAt: new Date(),
    }));

    const breakdown = calculator.composeBreakdown(
      worstActivity,
      worstIncidents,
      manyIndicators,
      0,
    );
    const score = calculator.composeFinalScore(breakdown);

    expect(score).toBeGreaterThanOrEqual(REPUTATION_SCORE_MIN);
    expect(score).toBeLessThanOrEqual(REPUTATION_SCORE_MAX);
    expect(calculator.tierForScore(score)).toBe(ReputationTier.HIGH_RISK);
  });

  it('treats a wallet with no data neutrally rather than penalizing it as risky', () => {
    const unknownActivity: WalletActivitySnapshot = {
      walletAddress: '0xUnknown',
      chainId: 'stellar',
      firstSeenAt: null,
      lastSeenAt: null,
      totalTransactions: 0,
      activeDaysLast90: 0,
      counterpartyAddresses: [],
    };
    const unknownIncidents: WalletIncidentSummary = {
      walletAddress: '0xUnknown',
      openIncidents: 0,
      resolvedIncidents: 0,
      confirmedFraudCases: 0,
      lastIncidentAt: null,
    };

    const breakdown = calculator.composeBreakdown(unknownActivity, unknownIncidents, [], null);
    const score = calculator.composeFinalScore(breakdown);

    // Should land in a middling tier, not be dragged straight to HIGH_RISK.
    expect(score).toBeGreaterThan(20);
  });
});

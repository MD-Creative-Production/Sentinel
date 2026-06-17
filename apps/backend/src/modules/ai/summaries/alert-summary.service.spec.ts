import { Test, TestingModule } from '@nestjs/testing';
import { AlertSummaryService } from './alert-summary.service';

describe('AlertSummaryService', () => {
  let service: AlertSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertSummaryService],
    }).compile();

    service = module.get<AlertSummaryService>(AlertSummaryService);
  });

  it('creates a human-readable summary, risk explanation, and recommendations', () => {
    const result = service.generateAlertSummary({
      title: 'Critical Alert: Ownership Transfer Detected',
      message: 'Contract 0x1234 is attempting to transfer ownership to 0x5678 before confirmation.',
      severity: 'critical',
      metadata: {
        signature: 'renounceOwnership',
        contract: '0x1234',
      },
    });

    expect(result.summary).toContain('ownership transfer');
    expect(result.riskExplanation).toContain('loss of control');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some(action => /pause|review|verify/i.test(action))).toBe(true);
  });
});

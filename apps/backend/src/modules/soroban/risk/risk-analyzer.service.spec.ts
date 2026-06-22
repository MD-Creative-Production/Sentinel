import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { RiskAnalyzerService } from './risk-analyzer.service';

describe('RiskAnalyzerService', () => {
  let service: RiskAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskAnalyzerService],
    }).compile();

    service = module.get<RiskAnalyzerService>(RiskAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeContract', () => {
    it('returns no findings and riskScore 0 for unknown signatures', () => {
      const result = service.analyzeContract({
        contractId: 'CTEST001',
        observedSignatures: ['unknown_fn'],
      });
      expect(result.findings).toHaveLength(0);
      expect(result.overallRisk).toBe('none');
      expect(result.riskScore).toBe(0);
    });

    it('detects a critical finding for set_admin signature', () => {
      const result = service.analyzeContract({
        contractId: 'CTEST002',
        observedSignatures: ['set_admin'],
      });
      const finding = result.findings.find(f => f.signature === 'set_admin');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('critical');
      expect(result.overallRisk).toBe('critical');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('detects a high finding for transfer signature', () => {
      const result = service.analyzeContract({
        contractId: 'CTEST003',
        observedSignatures: ['transfer'],
      });
      const finding = result.findings.find(f => f.signature === 'transfer');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('high');
    });

    it('overallRisk is the highest severity among findings', () => {
      const result = service.analyzeContract({
        contractId: 'CTEST004',
        observedSignatures: ['pause', 'upgrade'],
      });
      expect(result.overallRisk).toBe('critical');
    });

    it('riskScore is capped at 100', () => {
      const result = service.analyzeContract({
        contractId: 'CTEST005',
        observedSignatures: ['set_admin', 'upgrade', 'transfer', 'mint', 'pause'],
      });
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('echoes back contractId and observedSignatures', () => {
      const dto = { contractId: 'CTEST006', observedSignatures: ['mint'] };
      const result = service.analyzeContract(dto);
      expect(result.contractId).toBe(dto.contractId);
      expect(result.observedSignatures).toEqual(dto.observedSignatures);
    });

    it('analyzedAt is a valid ISO timestamp', () => {
      const result = service.analyzeContract({ contractId: 'CTEST007', observedSignatures: [] });
      expect(new Date(result.analyzedAt).toISOString()).toBe(result.analyzedAt);
    });
  });
});

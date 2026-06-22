import { Injectable } from '@nestjs/common';
import {
  AnalyzeContractDto,
  RiskAnalysisResult,
  RiskFinding,
  RiskSeverity,
} from './interfaces/risk-analyzer.interface';
import sorobanSignatures from '../../../../../../signatures/soroban.json';

interface SorobanPattern {
  id: string;
  name: string;
  signature: string;
  severity: string;
  description: string;
}

const SEVERITY_SCORE: Record<RiskSeverity, number> = {
  medium: 30,
  high: 60,
  critical: 100,
};

const SEVERITY_ORDER: Array<RiskSeverity | 'none'> = ['none', 'medium', 'high', 'critical'];

function maxSeverity(a: RiskSeverity | 'none', b: RiskSeverity | 'none'): RiskSeverity | 'none' {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

@Injectable()
export class RiskAnalyzerService {
  private readonly patterns: SorobanPattern[] = sorobanSignatures;

  analyzeContract(dto: AnalyzeContractDto): RiskAnalysisResult {
    const findings: RiskFinding[] = [];

    for (const pattern of this.patterns) {
      if (dto.observedSignatures.includes(pattern.signature)) {
        findings.push({
          id: pattern.id,
          name: pattern.name,
          signature: pattern.signature,
          severity: pattern.severity as RiskSeverity,
          description: pattern.description,
        });
      }
    }

    const overallRisk = findings.reduce<RiskSeverity | 'none'>(
      (acc, f) => maxSeverity(acc, f.severity),
      'none',
    );

    const riskScore =
      findings.length === 0
        ? 0
        : Math.min(
            100,
            findings.reduce((sum, f) => sum + SEVERITY_SCORE[f.severity], 0),
          );

    return {
      contractId: dto.contractId,
      analyzedAt: new Date().toISOString(),
      observedSignatures: dto.observedSignatures,
      findings,
      overallRisk,
      riskScore,
    };
  }
}

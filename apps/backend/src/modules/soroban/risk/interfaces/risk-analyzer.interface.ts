export type RiskSeverity = 'medium' | 'high' | 'critical';

export interface RiskFinding {
  /** Signature ID from soroban.json (e.g. "SOROBAN-001") */
  id: string;
  /** Human-readable name of the detected pattern */
  name: string;
  /** Matched function signature */
  signature: string;
  severity: RiskSeverity;
  description: string;
}

export interface RiskAnalysisResult {
  contractId: string;
  analyzedAt: string;
  /** Signatures/invocations observed in the contract's transaction history */
  observedSignatures: string[];
  findings: RiskFinding[];
  /** Highest severity found, or 'none' if clean */
  overallRisk: RiskSeverity | 'none';
  riskScore: number;
}

export interface AnalyzeContractDto {
  /** Soroban contract ID or address */
  contractId: string;
  /** Function signatures observed in the contract (e.g. from transaction history) */
  observedSignatures: string[];
}

// src/modules/security-posture/interfaces/asset-drain.interface.ts
import { AssetRiskSeverity } from '../enums/asset-risk.enum';

export interface AssetTransferEvent {
  transactionHash: string;
  tokenAddress: string;
  amount: number; // Normalized decimal value
  usdValue: number; // Value at time of execution
  timestamp: Date;
}

export interface DrainageEvaluationResult {
  isDraining: boolean;
  severity: AssetRiskSeverity;
  totalValueLostUsd: number;
  percentageDrop: number;
  deductionScore: number;
}

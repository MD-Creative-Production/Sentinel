export interface WalletTransaction {
  txHash: string;
  walletAddress: string;
  counterparty: string;
  asset: string;
  amount: number;
  timestamp: string;
  chain: string;
}

export interface WalletProfile {
  walletAddress: string;
  chain: string;
  totalTransactions: number;
  totalVolume: number;
  uniqueCounterparties: number;
  firstSeen: string;
  lastSeen: string;
}

export interface BehaviorBaseline {
  walletAddress: string;
  avgDailyTransactions: number;
  avgTransactionAmount: number;
  typicalCounterparties: string[];
  typicalAssets: string[];
}

export interface WalletAnomaly {
  walletAddress: string;
  type: 'volume_spike' | 'new_counterparty' | 'unusual_asset' | 'frequency_spike';
  description: string;
  detectedAt: string;
}

export interface BehavioralAnalysisResult {
  profile: WalletProfile;
  baseline: BehaviorBaseline;
  anomalies: WalletAnomaly[];
  generatedAt: string;
}

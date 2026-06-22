import { Injectable } from '@nestjs/common';
import {
  BehavioralAnalysisResult,
  BehaviorBaseline,
  WalletAnomaly,
  WalletProfile,
  WalletTransaction,
} from './interfaces/behavioral-analysis.interface';

@Injectable()
export class BehavioralAnalysisService {
  /** Build a historical profile from a wallet's transactions. */
  buildProfile(transactions: WalletTransaction[]): WalletProfile {
    if (transactions.length === 0) {
      throw new Error('No transactions provided for profiling');
    }

    const sorted = [...transactions].sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
    );

    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const counterparties = new Set(transactions.map(tx => tx.counterparty));

    return {
      walletAddress: transactions[0].walletAddress,
      chain: transactions[0].chain,
      totalTransactions: transactions.length,
      totalVolume,
      uniqueCounterparties: counterparties.size,
      firstSeen: sorted[0].timestamp,
      lastSeen: sorted[sorted.length - 1].timestamp,
    };
  }

  /** Establish a behavior baseline from historical transactions. */
  buildBaseline(transactions: WalletTransaction[]): BehaviorBaseline {
    const days = this.uniqueDays(transactions);
    const avgDailyTransactions = days > 0 ? transactions.length / days : transactions.length;
    const avgTransactionAmount =
      transactions.length > 0
        ? transactions.reduce((s, tx) => s + tx.amount, 0) / transactions.length
        : 0;

    const counterparties = [...new Set(transactions.map(tx => tx.counterparty))];
    const assets = [...new Set(transactions.map(tx => tx.asset))];

    return {
      walletAddress: transactions[0]?.walletAddress ?? '',
      avgDailyTransactions,
      avgTransactionAmount,
      typicalCounterparties: counterparties,
      typicalAssets: assets,
    };
  }

  /** Detect anomalies in recent transactions compared to the baseline. */
  detectAnomalies(recentTxs: WalletTransaction[], baseline: BehaviorBaseline): WalletAnomaly[] {
    const anomalies: WalletAnomaly[] = [];
    const now = new Date().toISOString();

    // Volume spike: any single tx > 3x average
    for (const tx of recentTxs) {
      if (baseline.avgTransactionAmount > 0 && tx.amount > baseline.avgTransactionAmount * 3) {
        anomalies.push({
          walletAddress: tx.walletAddress,
          type: 'volume_spike',
          description: `Transaction ${tx.txHash} amount ${tx.amount} exceeds 3x baseline average`,
          detectedAt: now,
        });
      }
    }

    // New counterparty not seen in baseline
    for (const tx of recentTxs) {
      if (!baseline.typicalCounterparties.includes(tx.counterparty)) {
        anomalies.push({
          walletAddress: tx.walletAddress,
          type: 'new_counterparty',
          description: `Interaction with new counterparty ${tx.counterparty}`,
          detectedAt: now,
        });
      }
    }

    // Unusual asset not seen in baseline
    for (const tx of recentTxs) {
      if (!baseline.typicalAssets.includes(tx.asset)) {
        anomalies.push({
          walletAddress: tx.walletAddress,
          type: 'unusual_asset',
          description: `Unusual asset ${tx.asset} not present in baseline`,
          detectedAt: now,
        });
      }
    }

    return anomalies;
  }

  /** Run full behavioral analysis: profile + baseline + anomaly detection. */
  analyze(
    historicalTxs: WalletTransaction[],
    recentTxs: WalletTransaction[],
  ): BehavioralAnalysisResult {
    const profile = this.buildProfile(historicalTxs);
    const baseline = this.buildBaseline(historicalTxs);
    const anomalies = this.detectAnomalies(recentTxs, baseline);

    return { profile, baseline, anomalies, generatedAt: new Date().toISOString() };
  }

  private uniqueDays(txs: WalletTransaction[]): number {
    return new Set(txs.map(tx => tx.timestamp.slice(0, 10))).size;
  }
}

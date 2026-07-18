import { PolicyEvaluationResult } from './policy-evaluation-result.interface';
import { TransactionData } from './transaction-data.interface';

export interface ITreasuryPolicyService {
  evaluateTransaction(transaction: TransactionData): Promise<PolicyEvaluationResult[]>;
  evaluatePoliciesForWallet(walletAddress: string, chainId: number): Promise<PolicyEvaluationResult[]>;
  getActivePolicies(walletAddress: string, chainId: number): Promise<any[]>;
}

export interface ITreasuryPolicyEngine {
  evaluate(transaction: TransactionData, policy: any): Promise<PolicyEvaluationResult>;
  evaluateAll(transaction: TransactionData, policies: any[]): Promise<PolicyEvaluationResult[]>;
}

export interface ITreasuryPolicyScheduler {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export interface PolicyEvaluationResult {
  policyId: string;
  policyName: string;
  walletAddress: string;
  chainId: number;
  transactionHash: string;
  violated: boolean;
  violatedRule?: string;
  thresholdValue?: string;
  observedValue?: string;
  severity?: string;
  recommendedAction?: string;
  contextData?: Record<string, unknown>;
}

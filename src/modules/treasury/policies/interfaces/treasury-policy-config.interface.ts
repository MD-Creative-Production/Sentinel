export interface TreasuryPolicyConfig {
  chainId: number;
  walletAddress: string;
  pollIntervalMs?: number;
  enabled?: boolean;
  networkName?: string;
}

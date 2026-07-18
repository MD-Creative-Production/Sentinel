export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: Date;
  chainId: number;
  balanceBefore?: string;
  balanceAfter?: string;
}

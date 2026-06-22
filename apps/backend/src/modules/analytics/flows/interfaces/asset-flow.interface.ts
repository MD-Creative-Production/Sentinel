export interface AssetTransfer {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  asset: string;
  amount: number;
  timestamp: string;
  chain: string;
}

export interface FlowNode {
  id: string;
  address: string;
  chain: string;
  totalSent: number;
  totalReceived: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  asset: string;
  totalAmount: number;
  txCount: number;
}

export interface AssetFlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  generatedAt: string;
}

export interface AssetFlowQuery {
  address: string;
  chain?: string;
  asset?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  depth?: number;
}

import { Injectable } from '@nestjs/common';
import {
  AssetFlowGraph,
  AssetFlowQuery,
  AssetTransfer,
  FlowEdge,
  FlowNode,
} from './interfaces/asset-flow.interface';

@Injectable()
export class AssetFlowService {
  /**
   * Generates an asset flow graph from a list of transfers.
   * Builds nodes (unique addresses) and directed edges (address→address
   * per asset), aggregating amounts and transaction counts.
   */
  generateGraph(transfers: AssetTransfer[]): AssetFlowGraph {
    const nodeMap = new Map<string, FlowNode>();
    const edgeMap = new Map<string, FlowEdge>();

    const upsertNode = (address: string, chain: string) => {
      if (!nodeMap.has(address)) {
        nodeMap.set(address, { id: address, address, chain, totalSent: 0, totalReceived: 0 });
      }
    };

    for (const tx of transfers) {
      upsertNode(tx.fromAddress, tx.chain);
      upsertNode(tx.toAddress, tx.chain);

      nodeMap.get(tx.fromAddress)!.totalSent += tx.amount;
      nodeMap.get(tx.toAddress)!.totalReceived += tx.amount;

      const edgeKey = `${tx.fromAddress}:${tx.toAddress}:${tx.asset}`;
      const existing = edgeMap.get(edgeKey);
      if (existing) {
        existing.totalAmount += tx.amount;
        existing.txCount += 1;
      } else {
        edgeMap.set(edgeKey, {
          from: tx.fromAddress,
          to: tx.toAddress,
          asset: tx.asset,
          totalAmount: tx.amount,
          txCount: 1,
        });
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Filters transfers by the provided query parameters before graph generation.
   */
  queryFlow(transfers: AssetTransfer[], query: AssetFlowQuery): AssetFlowGraph {
    const { address, chain, asset, fromTimestamp, toTimestamp } = query;

    const filtered = transfers.filter(tx => {
      const involvesAddress = tx.fromAddress === address || tx.toAddress === address;
      if (!involvesAddress) return false;
      if (chain && tx.chain !== chain) return false;
      if (asset && tx.asset !== asset) return false;
      if (fromTimestamp && tx.timestamp < fromTimestamp) return false;
      if (toTimestamp && tx.timestamp > toTimestamp) return false;
      return true;
    });

    return this.generateGraph(filtered);
  }

  /**
   * Returns the historical transfer chain for a given address, ordered by
   * timestamp ascending.
   */
  traceHistory(transfers: AssetTransfer[], address: string): AssetTransfer[] {
    return transfers
      .filter(tx => tx.fromAddress === address || tx.toAddress === address)
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
  }
}

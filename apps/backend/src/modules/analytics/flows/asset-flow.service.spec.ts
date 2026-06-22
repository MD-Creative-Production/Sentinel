import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetFlowService } from './asset-flow.service';
import { AssetTransfer } from './interfaces/asset-flow.interface';

const TRANSFERS: AssetTransfer[] = [
  {
    txHash: 'tx1',
    fromAddress: 'ADDR_A',
    toAddress: 'ADDR_B',
    asset: 'XLM',
    amount: 100,
    timestamp: '2026-01-01T00:00:00Z',
    chain: 'Stellar',
  },
  {
    txHash: 'tx2',
    fromAddress: 'ADDR_B',
    toAddress: 'ADDR_C',
    asset: 'XLM',
    amount: 50,
    timestamp: '2026-01-02T00:00:00Z',
    chain: 'Stellar',
  },
  {
    txHash: 'tx3',
    fromAddress: 'ADDR_A',
    toAddress: 'ADDR_B',
    asset: 'USDC',
    amount: 200,
    timestamp: '2026-01-03T00:00:00Z',
    chain: 'Stellar',
  },
];

describe('AssetFlowService', () => {
  let service: AssetFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetFlowService],
    }).compile();

    service = module.get<AssetFlowService>(AssetFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateGraph', () => {
    it('builds correct nodes from transfers', () => {
      const graph = service.generateGraph(TRANSFERS);
      const ids = graph.nodes.map(n => n.id).sort();
      expect(ids).toEqual(['ADDR_A', 'ADDR_B', 'ADDR_C'].sort());
    });

    it('aggregates totalSent and totalReceived per node', () => {
      const graph = service.generateGraph(TRANSFERS);
      const a = graph.nodes.find(n => n.id === 'ADDR_A')!;
      expect(a.totalSent).toBe(300);
      expect(a.totalReceived).toBe(0);
      const b = graph.nodes.find(n => n.id === 'ADDR_B')!;
      expect(b.totalReceived).toBe(300);
      expect(b.totalSent).toBe(50);
    });

    it('creates separate edges for different assets between same addresses', () => {
      const graph = service.generateGraph(TRANSFERS);
      const abEdges = graph.edges.filter(e => e.from === 'ADDR_A' && e.to === 'ADDR_B');
      expect(abEdges.length).toBe(2);
    });

    it('aggregates txCount and totalAmount for repeated asset+pair', () => {
      const repeated: AssetTransfer[] = [
        { ...TRANSFERS[0] },
        { ...TRANSFERS[0], txHash: 'tx1b', amount: 40 },
      ];
      const graph = service.generateGraph(repeated);
      const edge = graph.edges[0];
      expect(edge.txCount).toBe(2);
      expect(edge.totalAmount).toBe(140);
    });

    it('returns a valid ISO timestamp in generatedAt', () => {
      const graph = service.generateGraph(TRANSFERS);
      expect(new Date(graph.generatedAt).toISOString()).toBe(graph.generatedAt);
    });

    it('returns empty graph for empty transfers', () => {
      const graph = service.generateGraph([]);
      expect(graph.nodes).toHaveLength(0);
      expect(graph.edges).toHaveLength(0);
    });
  });

  describe('queryFlow', () => {
    it('filters by address', () => {
      const graph = service.queryFlow(TRANSFERS, { address: 'ADDR_C' });
      expect(graph.nodes.some(n => n.id === 'ADDR_C')).toBe(true);
      expect(graph.nodes.some(n => n.id === 'ADDR_A')).toBe(false);
    });

    it('filters by asset', () => {
      const graph = service.queryFlow(TRANSFERS, { address: 'ADDR_A', asset: 'USDC' });
      expect(graph.edges.every(e => e.asset === 'USDC')).toBe(true);
    });

    it('filters by fromTimestamp', () => {
      const graph = service.queryFlow(TRANSFERS, {
        address: 'ADDR_A',
        fromTimestamp: '2026-01-02T00:00:00Z',
      });
      expect(graph.edges.every(e => e.asset === 'USDC')).toBe(true);
    });
  });

  describe('traceHistory', () => {
    it('returns only transfers involving the given address', () => {
      const history = service.traceHistory(TRANSFERS, 'ADDR_B');
      expect(history.every(tx => tx.fromAddress === 'ADDR_B' || tx.toAddress === 'ADDR_B')).toBe(
        true,
      );
    });

    it('returns transfers sorted by timestamp ascending', () => {
      const history = service.traceHistory(TRANSFERS, 'ADDR_A');
      const timestamps = history.map(tx => tx.timestamp);
      expect(timestamps).toEqual([...timestamps].sort());
    });

    it('returns empty array when address has no transfers', () => {
      expect(service.traceHistory(TRANSFERS, 'UNKNOWN')).toHaveLength(0);
    });
  });
});

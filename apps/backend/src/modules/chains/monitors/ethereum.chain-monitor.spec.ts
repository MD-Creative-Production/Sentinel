import { EthereumChainMonitor } from './ethereum.chain-monitor';
import { NormalizedChainEvent } from '../interfaces/normalized-chain-event.interface';

// Mock the ethers module so that ethers.JsonRpcProvider returns a controlled stub
const mockGetBlockNumber = jest.fn();
const mockGetBlock = jest.fn();

jest.mock('ethers', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const actual = jest.requireActual('ethers');
  const formatEther = actual.formatEther ?? actual.ethers?.formatEther;
  return {
    __esModule: true,
    ethers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        getBlockNumber: mockGetBlockNumber,
        getBlock: mockGetBlock,
      })),
      formatEther,
    },
  };
});

describe('EthereumChainMonitor', () => {
  let monitor: EthereumChainMonitor;

  beforeEach(() => {
    jest.useFakeTimers();
    mockGetBlockNumber.mockReset();
    mockGetBlock.mockReset();

    monitor = new EthereumChainMonitor('http://localhost:8545', 5000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('chainId', () => {
    it('returns "ethereum"', () => {
      expect(monitor.chainId).toBe('ethereum');
    });
  });

  describe('normalizeEvent', () => {
    it('normalizes a native ETH transfer', () => {
      const raw: Record<string, unknown> = {
        hash: '0xabc123',
        from: '0xalice',
        to: '0xbob',
        value: '1000000000000000000', // 1 ETH
        data: '0x',
        blockTimestamp: 1700000000,
      };

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.chainId).toBe('ethereum');
      expect(result.txHash).toBe('0xabc123');
      expect(result.from).toBe('0xalice');
      expect(result.to).toBe('0xbob');
      expect(result.amount).toBe('1.0');
      expect(result.asset).toBe('ETH');
      expect(result.eventType).toBe('transfer');
    });

    it('normalizes a contract call with input data', () => {
      const raw: Record<string, unknown> = {
        hash: '0xdef456',
        from: '0xalice',
        to: '0xcontract',
        value: '0',
        data: '0xa9059cbb000000000000000000000000',
        blockTimestamp: 1700000000,
      };

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.eventType).toBe('contract_call');
      expect(result.to).toBe('0xcontract');
      expect(result.amount).toBeUndefined();
    });

    it('normalizes a contract deployment (no "to" field)', () => {
      const raw: Record<string, unknown> = {
        hash: '0xghi789',
        from: '0xdeployer',
        data: '0x6080604052',
        blockTimestamp: 1700000000,
      };

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.eventType).toBe('contract_deploy');
      expect(result.to).toBeUndefined();
    });

    it('handles blockTimestamp as a string', () => {
      const raw: Record<string, unknown> = {
        hash: '0x123',
        from: '0xalice',
        data: '0x',
        blockTimestamp: '2024-01-01T00:00:00.000Z',
      };

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('handles missing fields gracefully', () => {
      const raw: Record<string, unknown> = {};

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.chainId).toBe('ethereum');
      expect(result.txHash).toBe('');
      expect(result.from).toBe('');
      expect(result.to).toBeUndefined();
      expect(result.eventType).toBe('contract_deploy');
      expect(result.raw).toBe(raw);
    });

    it('includes the raw event payload', () => {
      const raw: Record<string, unknown> = {
        hash: '0xfull',
        from: '0xalice',
        customField: 'extra-data',
      };

      const result: NormalizedChainEvent = monitor.normalizeEvent(raw);

      expect(result.raw).toBe(raw);
      expect(result.raw.customField).toBe('extra-data');
    });
  });

  describe('subscribe', () => {
    it('polls for new blocks and emits normalized events', async () => {
      // First call (initial sync) returns 4, second call (poll) returns 5
      mockGetBlockNumber.mockResolvedValueOnce(4).mockResolvedValue(5);
      mockGetBlock.mockImplementation((blockNum: number, _includeTxs: boolean) => {
        if (blockNum <= 5) {
          return Promise.resolve({
            number: blockNum,
            timestamp: 1700000000 + blockNum,
            transactions: [
              {
                hash: `0xblock${blockNum}tx0`,
                from: '0xalice',
                to: '0xbob',
                value: BigInt('1000000000000000000'),
                data: '0x',
              },
            ],
          });
        }
        return Promise.resolve(null);
      });

      const callback = jest.fn();

      // subscribe resolves after the first poll cycle, which includes the callback
      await monitor.subscribe(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('prevents duplicate polling when subscribe is called twice', async () => {
      mockGetBlockNumber.mockResolvedValue(1);
      mockGetBlock.mockResolvedValue(null);

      await monitor.subscribe(jest.fn());

      // Second subscribe should return early without throwing
      await expect(monitor.subscribe(jest.fn())).resolves.toBeUndefined();
    });
  });

  describe('isHealthy', () => {
    it('returns true when RPC responds with a block number', async () => {
      mockGetBlockNumber.mockResolvedValue(21000000);

      const healthy = await monitor.isHealthy();

      expect(healthy).toBe(true);
    });

    it('returns false when RPC throws', async () => {
      mockGetBlockNumber.mockRejectedValue(new Error('connection refused'));

      const healthy = await monitor.isHealthy();

      expect(healthy).toBe(false);
    });

    it('returns false when block number is negative', async () => {
      mockGetBlockNumber.mockResolvedValue(-1);

      const healthy = await monitor.isHealthy();

      expect(healthy).toBe(false);
    });
  });
});

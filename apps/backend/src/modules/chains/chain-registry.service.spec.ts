import { Test, TestingModule } from '@nestjs/testing';
import { ChainRegistryService } from './chain-registry.service';
import { IChainMonitor } from './interfaces/chain-monitor.interface';
import { NormalizedChainEvent } from './interfaces/normalized-chain-event.interface';

const makeEvent = (chainId: string): NormalizedChainEvent => ({
  timestamp: new Date().toISOString(),
  chainId,
  eventType: 'payment',
  txHash: 'abc123',
  from: 'GABC',
  raw: {},
});

const makeMonitor = (chainId: string, healthy = true): jest.Mocked<IChainMonitor> => ({
  chainId,
  normalizeEvent: jest.fn(_raw => makeEvent(chainId)),
  subscribe: jest.fn().mockResolvedValue(undefined),
  isHealthy: jest.fn().mockResolvedValue(healthy),
});

describe('ChainRegistryService', () => {
  let service: ChainRegistryService;
  let stellar: jest.Mocked<IChainMonitor>;
  let ethereum: jest.Mocked<IChainMonitor>;

  beforeEach(async () => {
    stellar = makeMonitor('stellar');
    ethereum = makeMonitor('ethereum');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChainRegistryService,
        { provide: 'CHAIN_MONITORS', useValue: [stellar, ethereum] },
      ],
    }).compile();

    service = module.get<ChainRegistryService>(ChainRegistryService);
  });

  it('registers all monitors and returns their chain IDs', () => {
    expect(service.getChainIds()).toEqual(expect.arrayContaining(['stellar', 'ethereum']));
  });

  it('returns the correct monitor for a given chainId', () => {
    expect(service.getMonitor('stellar')).toBe(stellar);
    expect(service.getMonitor('ethereum')).toBe(ethereum);
  });

  it('returns undefined for an unknown chainId', () => {
    expect(service.getMonitor('polygon')).toBeUndefined();
  });

  it('calls subscribe on all monitors when subscribeAll is invoked', async () => {
    const callback = jest.fn();
    await service.subscribeAll(callback);
    expect(stellar.subscribe).toHaveBeenCalledWith(callback);
    expect(ethereum.subscribe).toHaveBeenCalledWith(callback);
  });

  it('continues subscribeAll when one monitor throws', async () => {
    stellar.subscribe.mockRejectedValue(new Error('connection refused'));
    const callback = jest.fn();
    await expect(service.subscribeAll(callback)).resolves.not.toThrow();
    expect(ethereum.subscribe).toHaveBeenCalled();
  });

  it('returns health status for all monitors', async () => {
    ethereum.isHealthy.mockResolvedValue(false);
    const health = await service.getHealth();
    expect(health).toEqual({ stellar: true, ethereum: false });
  });

  it('returns false for a monitor whose health check throws', async () => {
    stellar.isHealthy.mockRejectedValue(new Error('timeout'));
    const health = await service.getHealth();
    expect(health.stellar).toBe(false);
  });

  it('warns and resolves when no monitors are registered', async () => {
    const emptyModule = await Test.createTestingModule({
      providers: [ChainRegistryService, { provide: 'CHAIN_MONITORS', useValue: [] }],
    }).compile();

    const emptyService = emptyModule.get<ChainRegistryService>(ChainRegistryService);
    await expect(emptyService.subscribeAll(jest.fn())).resolves.not.toThrow();
  });
});

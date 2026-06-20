import { Test, TestingModule } from '@nestjs/testing';
import { SiemService } from './siem.service';
import { ISiemProvider } from './interfaces/siem-provider.interface';
import { SiemEvent } from './interfaces/siem-event.interface';

const makeEvent = (overrides: Partial<SiemEvent> = {}): SiemEvent => ({
  timestamp: new Date().toISOString(),
  eventType: 'test_event',
  title: 'Test Event',
  message: 'A test security event',
  severity: 'low',
  source: 'stellar',
  ...overrides,
});

const makeProvider = (name: string, healthy = true): jest.Mocked<ISiemProvider> => ({
  providerName: name,
  forwardEvent: jest.fn().mockResolvedValue(undefined),
  isHealthy: jest.fn().mockResolvedValue(healthy),
});

describe('SiemService', () => {
  let service: SiemService;
  let providerA: jest.Mocked<ISiemProvider>;
  let providerB: jest.Mocked<ISiemProvider>;

  beforeEach(async () => {
    providerA = makeProvider('splunk');
    providerB = makeProvider('elastic');

    const module: TestingModule = await Test.createTestingModule({
      providers: [SiemService, { provide: 'SIEM_PROVIDERS', useValue: [providerA, providerB] }],
    }).compile();

    service = module.get<SiemService>(SiemService);
  });

  it('forwards events to all providers', async () => {
    const event = makeEvent();
    await service.forwardEvent(event);
    expect(providerA.forwardEvent).toHaveBeenCalledWith(event);
    expect(providerB.forwardEvent).toHaveBeenCalledWith(event);
  });

  it('continues delivery when one provider fails', async () => {
    providerA.forwardEvent.mockRejectedValue(new Error('network error'));
    const event = makeEvent({ severity: 'critical' });
    await expect(service.forwardEvent(event)).resolves.not.toThrow();
    expect(providerB.forwardEvent).toHaveBeenCalledWith(event);
  });

  it('logs a warning and skips when no providers are configured', async () => {
    const emptyModule = await Test.createTestingModule({
      providers: [SiemService, { provide: 'SIEM_PROVIDERS', useValue: [] }],
    }).compile();

    const emptyService = emptyModule.get<SiemService>(SiemService);
    await expect(emptyService.forwardEvent(makeEvent())).resolves.not.toThrow();
  });

  it('returns health status for all providers', async () => {
    providerB.isHealthy.mockResolvedValue(false);
    const health = await service.getProvidersHealth();
    expect(health).toEqual({ splunk: true, elastic: false });
  });

  it('returns false for a provider whose health check throws', async () => {
    providerA.isHealthy.mockRejectedValue(new Error('timeout'));
    const health = await service.getProvidersHealth();
    expect(health.splunk).toBe(false);
  });

  it('returns all provider names', () => {
    expect(service.getProviderNames()).toEqual(['splunk', 'elastic']);
  });
});

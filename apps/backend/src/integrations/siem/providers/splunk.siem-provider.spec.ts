import axios from 'axios';
import { SplunkSiemProvider } from './splunk.siem-provider';
import { SplunkSiemConfig } from '../dto/siem-config.dto';
import { SiemEvent } from '../interfaces/siem-event.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// jest.mock('axios') auto-mocks every export, including isAxiosError, which
// would otherwise return undefined and break the provider's retry logic.
// Restore the real implementation so retryable-vs-not classification works.
mockedAxios.isAxiosError = jest.requireActual('axios').isAxiosError;

const makeConfig = (overrides: Partial<SplunkSiemConfig> = {}): SplunkSiemConfig => ({
  hecUrl: 'https://splunk.corp:8088/services/collector',
  hecToken: 'test-hec-token',
  retryBaseDelayMs: 1, // keep tests fast
  ...overrides,
});

const makeEvent = (overrides: Partial<SiemEvent> = {}): SiemEvent => ({
  timestamp: '2026-06-19T10:00:00.000Z',
  eventType: 'suspicious_transaction',
  title: 'Suspicious Transaction Detected',
  message: 'Large transaction detected from flagged address',
  severity: 'high',
  source: 'stellar',
  ...overrides,
});

describe('SplunkSiemProvider', () => {
  let provider: SplunkSiemProvider;
  let config: SplunkSiemConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    config = makeConfig();
    provider = new SplunkSiemProvider(config);
  });

  it('should have provider name "splunk"', () => {
    expect(provider.providerName).toBe('splunk');
  });

  describe('forwardEvent', () => {
    it('should forward event to the Splunk HEC endpoint', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      const event = makeEvent();
      await provider.forwardEvent(event);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://splunk.corp:8088/services/collector',
        expect.objectContaining({
          sourcetype: 'sentinel:security',
          event: expect.objectContaining({
            event_type: 'suspicious_transaction',
            title: 'Suspicious Transaction Detected',
            message: 'Large transaction detected from flagged address',
            severity: 'high',
            source: 'stellar',
          }),
        }),
        {
          headers: {
            Authorization: 'Splunk test-hec-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should use custom source type when provided', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      const customProvider = new SplunkSiemProvider(makeConfig({ sourceType: 'custom:type' }));
      await customProvider.forwardEvent(makeEvent());

      const body = mockedAxios.post.mock.calls[0][1] as { sourcetype: string };
      expect(body.sourcetype).toBe('custom:type');
    });

    it('should use default source type when not provided', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      await provider.forwardEvent(makeEvent());

      const body = mockedAxios.post.mock.calls[0][1] as { sourcetype: string };
      expect(body.sourcetype).toBe('sentinel:security');
    });

    it('should convert the ISO timestamp to epoch seconds', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      await provider.forwardEvent(makeEvent({ timestamp: '2026-06-19T10:00:00.000Z' }));

      const body = mockedAxios.post.mock.calls[0][1] as { time: number };
      expect(body.time).toBe(Math.floor(new Date('2026-06-19T10:00:00.000Z').getTime() / 1000));
    });

    it('should include metadata fields in the event payload', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      const event = makeEvent({
        metadata: { address: '0x1234', amount: 1000000, riskScore: 0.85 },
      });
      await provider.forwardEvent(event);

      const body = mockedAxios.post.mock.calls[0][1] as { event: Record<string, unknown> };
      expect(body.event.address).toBe('0x1234');
      expect(body.event.amount).toBe(1000000);
      expect(body.event.riskScore).toBe(0.85);
    });

    it('should succeed on the first attempt without retrying', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });

      await provider.forwardEvent(makeEvent());

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should retry on a 503 response and eventually succeed', async () => {
      mockedAxios.post
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 503 },
          message: 'Service Unavailable',
        })
        .mockResolvedValueOnce({ status: 200 });

      await provider.forwardEvent(makeEvent());

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should retry on a network error with no response', async () => {
      mockedAxios.post
        .mockRejectedValueOnce({ isAxiosError: true, message: 'ECONNREFUSED' })
        .mockResolvedValueOnce({ status: 200 });

      await provider.forwardEvent(makeEvent());

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should not retry on a 400 Bad Request and should throw immediately', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { text: 'Invalid event' } },
        message: 'Bad Request',
      });

      await expect(provider.forwardEvent(makeEvent())).rejects.toThrow(
        'SplunkSiemProvider.forwardEvent failed',
      );
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should give up after maxRetries and throw a wrapped error', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 500 },
        message: 'Internal Server Error',
      });

      const retryProvider = new SplunkSiemProvider(makeConfig({ maxRetries: 2 }));

      await expect(retryProvider.forwardEvent(makeEvent())).rejects.toThrow(
        'SplunkSiemProvider.forwardEvent failed',
      );
      // initial attempt + 2 retries = 3 calls
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('isHealthy', () => {
    it('should return true when the HEC endpoint responds', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const health = await provider.isHealthy();
      expect(health).toBe(true);
    });

    it('should return false when the health check fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection timeout'));

      const health = await provider.isHealthy();
      expect(health).toBe(false);
    });
  });
});

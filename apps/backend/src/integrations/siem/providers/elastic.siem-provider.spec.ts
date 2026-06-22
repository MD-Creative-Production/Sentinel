import axios from 'axios';
import { ElasticSiemProvider } from './elastic.siem-provider';
import { ElasticSiemConfig } from '../dto/siem-config.dto';
import { SiemEvent } from '../interfaces/siem-event.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeConfig = (overrides: Partial<ElasticSiemConfig> = {}): ElasticSiemConfig => ({
  elasticUrl: 'https://elastic.corp:9200',
  apiKey: 'test-api-key',
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

describe('ElasticSiemProvider', () => {
  let provider: ElasticSiemProvider;
  let config: ElasticSiemConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    config = makeConfig();
    provider = new ElasticSiemProvider(config);
  });

  it('should have provider name "elastic"', () => {
    expect(provider.providerName).toBe('elastic');
  });

  describe('forwardEvent', () => {
    it('should forward event to Elasticsearch bulk endpoint', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      const event = makeEvent();
      await provider.forwardEvent(event);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://elastic.corp:9200/_bulk',
        expect.any(String),
        {
          headers: {
            Authorization: 'ApiKey test-api-key',
            'Content-Type': 'application/x-ndjson',
          },
        },
      );
    });

    it('should use custom index when provided', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      const customConfig = makeConfig({ index: 'custom-sentinel-index' });
      const customProvider = new ElasticSiemProvider(customConfig);

      await customProvider.forwardEvent(makeEvent());

      const body = (mockedAxios.post.mock.calls[0][1] as string).split('\n');
      const indexLine = JSON.parse(body[0]);
      expect(indexLine.index._index).toBe('custom-sentinel-index');
    });

    it('should use default index when not provided', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      await provider.forwardEvent(makeEvent());

      const body = (mockedAxios.post.mock.calls[0][1] as string).split('\n');
      const indexLine = JSON.parse(body[0]);
      expect(indexLine.index._index).toBe('sentinel-events');
    });

    it('should format event with ECS-compliant fields', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      const event = makeEvent({ severity: 'critical' });
      await provider.forwardEvent(event);

      const body = (mockedAxios.post.mock.calls[0][1] as string).split('\n');
      const doc = JSON.parse(body[1]);

      expect(doc).toMatchObject({
        '@timestamp': '2026-06-19T10:00:00.000Z',
        'event.kind': 'alert',
        'event.category': 'intrusion_detection',
        'event.type': 'suspicious_transaction',
        'event.severity': 100,
        message: 'Large transaction detected from flagged address',
        labels: {
          title: 'Suspicious Transaction Detected',
          source: 'stellar',
          severity: 'critical',
        },
      });
    });

    it('should map severity levels correctly', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      const severities: Array<SiemEvent['severity']> = ['low', 'medium', 'high', 'critical'];
      const expectedValues = [25, 50, 75, 100];

      for (let i = 0; i < severities.length; i++) {
        mockedAxios.post.mockClear();
        const event = makeEvent({ severity: severities[i] });
        await provider.forwardEvent(event);

        const body = (mockedAxios.post.mock.calls[0][1] as string).split('\n');
        const doc = JSON.parse(body[1]);
        expect(doc['event.severity']).toBe(expectedValues[i]);
      }
    });

    it('should include metadata in the event document', async () => {
      mockedAxios.post.mockResolvedValue({ data: { items: [] } });

      const event = makeEvent({
        metadata: {
          address: '0x1234',
          amount: 1000000,
          riskScore: 0.85,
        },
      });
      await provider.forwardEvent(event);

      const body = (mockedAxios.post.mock.calls[0][1] as string).split('\n');
      const doc = JSON.parse(body[1]);

      expect(doc.address).toBe('0x1234');
      expect(doc.amount).toBe(1000000);
      expect(doc.riskScore).toBe(0.85);
    });

    it('should throw error when Elasticsearch request fails', async () => {
      // Create an error object that mimics axios error structure
      const axiosError = new Error('Request failed') as unknown as {
        isAxiosError: boolean;
        response: { data: { error: { reason: string } } };
      };
      axiosError.isAxiosError = true;
      axiosError.response = {
        data: {
          error: {
            reason: 'index_not_found_exception',
          },
        },
      };
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(provider.forwardEvent(makeEvent())).rejects.toThrow(
        'ElasticSiemProvider.forwardEvent failed',
      );
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(provider.forwardEvent(makeEvent())).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('isHealthy', () => {
    it('should return true when cluster health is green', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'green' },
      });

      const health = await provider.isHealthy();
      expect(health).toBe(true);
    });

    it('should return true when cluster health is yellow', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'yellow' },
      });

      const health = await provider.isHealthy();
      expect(health).toBe(true);
    });

    it('should return false when cluster health is red', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: 'red' },
      });

      const health = await provider.isHealthy();
      expect(health).toBe(false);
    });

    it('should return false when health check fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection timeout'));

      const health = await provider.isHealthy();
      expect(health).toBe(false);
    });

    it('should return false when response has no status field', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      const health = await provider.isHealthy();
      expect(health).toBe(false);
    });
  });
});

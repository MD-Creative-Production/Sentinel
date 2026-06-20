import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricThreshold, RegisterProtocolDto } from './interfaces/protocol-health.interface';
import { ProtocolHealthService } from './protocol-health.service';

const BASE_THRESHOLDS: MetricThreshold[] = [
  { metricType: 'error_rate', operator: 'gt', warnAt: 5, criticalAt: 10 },
  { metricType: 'transaction_count', operator: 'lt', warnAt: 10, criticalAt: 5 },
  { metricType: 'response_time_ms', operator: 'gt', warnAt: 1000, criticalAt: 3000 },
];

const STELLAR_DEX: RegisterProtocolDto = {
  protocolId: 'stellar-dex',
  name: 'Stellar DEX',
  chain: 'stellar',
  thresholds: BASE_THRESHOLDS,
};

describe('ProtocolHealthService', () => {
  let service: ProtocolHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProtocolHealthService],
    }).compile();

    service = module.get<ProtocolHealthService>(ProtocolHealthService);
  });

  describe('registerProtocol', () => {
    it('returns an initial snapshot with unknown/healthy status and no metrics', () => {
      const snapshot = service.registerProtocol(STELLAR_DEX);

      expect(snapshot.protocolId).toBe('stellar-dex');
      expect(snapshot.name).toBe('Stellar DEX');
      expect(snapshot.chain).toBe('stellar');
      expect(snapshot.status).toBe('healthy');
      expect(snapshot.metrics).toHaveLength(0);
      expect(snapshot.activeAlerts).toHaveLength(0);
    });

    it('throws ConflictException when protocol is already registered', () => {
      service.registerProtocol(STELLAR_DEX);
      expect(() => service.registerProtocol(STELLAR_DEX)).toThrow(ConflictException);
    });
  });

  describe('recordMetrics', () => {
    beforeEach(() => {
      service.registerProtocol(STELLAR_DEX);
    });

    it('throws NotFoundException for unknown protocol', () => {
      expect(() =>
        service.recordMetrics({
          protocolId: 'nonexistent',
          metrics: [{ type: 'error_rate', value: 1 }],
        }),
      ).toThrow(NotFoundException);
    });

    it('stores metrics and returns them in snapshot', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [
          { type: 'error_rate', value: 2 },
          { type: 'transaction_count', value: 50 },
        ],
      });

      expect(snapshot.metrics).toHaveLength(2);
      expect(snapshot.metrics.find(m => m.type === 'error_rate')?.value).toBe(2);
      expect(snapshot.metrics.find(m => m.type === 'transaction_count')?.value).toBe(50);
    });

    it('marks status healthy when all metrics are within thresholds', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [
          { type: 'error_rate', value: 2 },
          { type: 'transaction_count', value: 50 },
          { type: 'response_time_ms', value: 200 },
        ],
      });

      expect(snapshot.status).toBe('healthy');
      expect(snapshot.activeAlerts).toHaveLength(0);
    });
  });

  describe('threshold evaluation — gt operator', () => {
    beforeEach(() => {
      service.registerProtocol(STELLAR_DEX);
    });

    it('generates warning alert when metric exceeds warnAt', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 7 }],
      });

      expect(snapshot.status).toBe('degraded');
      expect(snapshot.activeAlerts).toHaveLength(1);
      expect(snapshot.activeAlerts[0].severity).toBe('warning');
      expect(snapshot.activeAlerts[0].metricType).toBe('error_rate');
      expect(snapshot.activeAlerts[0].currentValue).toBe(7);
    });

    it('generates critical alert when metric exceeds criticalAt', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 15 }],
      });

      expect(snapshot.status).toBe('critical');
      expect(snapshot.activeAlerts[0].severity).toBe('critical');
    });
  });

  describe('threshold evaluation — lt operator', () => {
    beforeEach(() => {
      service.registerProtocol(STELLAR_DEX);
    });

    it('generates warning alert when metric drops below warnAt', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'transaction_count', value: 8 }],
      });

      expect(snapshot.status).toBe('degraded');
      expect(snapshot.activeAlerts[0].severity).toBe('warning');
      expect(snapshot.activeAlerts[0].metricType).toBe('transaction_count');
    });

    it('generates critical alert when metric drops below criticalAt', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'transaction_count', value: 3 }],
      });

      expect(snapshot.status).toBe('critical');
      expect(snapshot.activeAlerts[0].severity).toBe('critical');
    });
  });

  describe('alert lifecycle', () => {
    beforeEach(() => {
      service.registerProtocol(STELLAR_DEX);
    });

    it('resolves alert when metric returns within threshold', () => {
      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 15 }],
      });

      const recovered = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 2 }],
      });

      expect(recovered.status).toBe('healthy');
      expect(recovered.activeAlerts).toHaveLength(0);
    });

    it('escalates warning to critical when value worsens', () => {
      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 7 }],
      });

      const escalated = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 20 }],
      });

      expect(escalated.activeAlerts).toHaveLength(1);
      expect(escalated.activeAlerts[0].severity).toBe('critical');
    });

    it('does not duplicate alerts for the same breach', () => {
      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 7 }],
      });

      const second = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 8 }],
      });

      expect(second.activeAlerts).toHaveLength(1);
    });

    it('alert message contains protocol name, metric type and values', () => {
      const snapshot = service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 15 }],
      });

      const msg = snapshot.activeAlerts[0].message;
      expect(msg).toContain('Stellar DEX');
      expect(msg).toContain('error_rate');
      expect(msg).toContain('15');
    });
  });

  describe('getActiveAlerts', () => {
    it('returns alerts across all protocols', () => {
      service.registerProtocol(STELLAR_DEX);
      service.registerProtocol({
        protocolId: 'eth-uniswap',
        name: 'Uniswap V3',
        chain: 'ethereum',
        thresholds: [{ metricType: 'error_rate', operator: 'gt', warnAt: 5, criticalAt: 10 }],
      });

      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 15 }],
      });
      service.recordMetrics({
        protocolId: 'eth-uniswap',
        metrics: [{ type: 'error_rate', value: 12 }],
      });

      const allAlerts = service.getActiveAlerts();
      expect(allAlerts).toHaveLength(2);
      expect(allAlerts.map(a => a.protocolId)).toContain('stellar-dex');
      expect(allAlerts.map(a => a.protocolId)).toContain('eth-uniswap');
    });

    it('excludes resolved alerts', () => {
      service.registerProtocol(STELLAR_DEX);

      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 15 }],
      });
      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'error_rate', value: 1 }],
      });

      expect(service.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('getAllProtocols', () => {
    it('returns snapshots for all registered protocols', () => {
      service.registerProtocol(STELLAR_DEX);
      service.registerProtocol({
        protocolId: 'eth-uniswap',
        name: 'Uniswap V3',
        chain: 'ethereum',
        thresholds: [],
      });

      const all = service.getAllProtocols();
      expect(all).toHaveLength(2);
      expect(all.map(p => p.protocolId)).toContain('stellar-dex');
      expect(all.map(p => p.protocolId)).toContain('eth-uniswap');
    });

    it('returns empty array when no protocols registered', () => {
      expect(service.getAllProtocols()).toHaveLength(0);
    });
  });

  describe('getProtocolHealth', () => {
    it('throws NotFoundException for unknown protocol', () => {
      expect(() => service.getProtocolHealth('nonexistent')).toThrow(NotFoundException);
    });

    it('returns current snapshot with latest metrics', () => {
      service.registerProtocol(STELLAR_DEX);
      service.recordMetrics({
        protocolId: 'stellar-dex',
        metrics: [{ type: 'response_time_ms', value: 500 }],
      });

      const snapshot = service.getProtocolHealth('stellar-dex');
      expect(snapshot.metrics.find(m => m.type === 'response_time_ms')?.value).toBe(500);
    });
  });
});

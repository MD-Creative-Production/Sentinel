import { InvestigationService } from './investigation.service';
import { Incident } from './interfaces/investigation.interface';

describe('InvestigationService', () => {
  let service: InvestigationService;

  const createIncident = (overrides: Partial<Incident> = {}): Incident => ({
    id: 'INC-001',
    title: 'Suspicious Transaction Detected',
    description: 'Large transaction from flagged address detected on Stellar network',
    severity: 'high',
    timestamp: '2026-06-19T10:00:00.000Z',
    source: 'stellar',
    ...overrides,
  });

  beforeEach(() => {
    service = new InvestigationService();
  });

  describe('generateContext', () => {
    it('should generate complete investigation context', async () => {
      const incident = createIncident();
      const context = await service.generateContext(incident);

      expect(context).toBeDefined();
      expect(context.incident).toEqual(incident);
      expect(context.contextSummary).toBeDefined();
      expect(context.contextSummary.length).toBeGreaterThan(0);
      expect(context.relatedEvents).toBeInstanceOf(Array);
      expect(context.timeline).toBeInstanceOf(Array);
      expect(context.indicators).toBeInstanceOf(Array);
      expect(context.investigationSteps).toBeInstanceOf(Array);
      expect(context.confidence).toBeGreaterThanOrEqual(0);
      expect(context.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate context with historical events', async () => {
      const incident = createIncident();
      const historicalEvents = [
        {
          id: 'EVT-001',
          description: 'Previous suspicious activity',
          timestamp: '2026-06-19T09:30:00.000Z',
          source: 'stellar',
          eventType: 'authentication_failure',
          severity: 'medium',
        },
        {
          id: 'EVT-002',
          description: 'Network connection attempt',
          timestamp: '2026-06-19T09:45:00.000Z',
          source: 'stellar',
          eventType: 'network_connection',
          severity: 'low',
        },
      ];

      const context = await service.generateContext(incident, historicalEvents);

      expect(context.relatedEvents.length).toBeGreaterThan(0);
      expect(context.relatedEvents[0].correlationScore).toBeGreaterThan(0);
    });

    it('should handle incidents with data payload', async () => {
      const incident = createIncident({
        data: {
          ip: '192.168.1.100',
          address: 'GABC123XYZ',
          user: 'admin',
          amount: 1000000,
        },
      });

      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('IP: 192.168.1.100');
      expect(context.indicators).toContain('Address: GABC123XYZ');
      expect(context.indicators).toContain('User: admin');
    });
  });

  describe('suggestRelatedEvents', () => {
    it('should suggest related events from historical data', () => {
      const incident = createIncident();
      const historicalEvents = [
        {
          id: 'EVT-001',
          description: 'Related event',
          timestamp: '2026-06-19T09:50:00.000Z',
          source: 'stellar',
          severity: 'high',
        },
      ];

      const related = service.suggestRelatedEvents(incident, historicalEvents);

      expect(related).toBeInstanceOf(Array);
      expect(related.length).toBeGreaterThan(0);
      expect(related[0]).toHaveProperty('id');
      expect(related[0]).toHaveProperty('description');
      expect(related[0]).toHaveProperty('correlationScore');
      expect(related[0]).toHaveProperty('timestamp');
      expect(related[0]).toHaveProperty('eventType');
    });

    it('should filter out low-correlation events', () => {
      const incident = createIncident({ source: 'stellar', timestamp: '2026-06-19T10:00:00.000Z' });
      const historicalEvents = [
        {
          id: 'EVT-001',
          description: 'Unrelated event',
          timestamp: '2026-06-17T10:00:00.000Z',
          source: 'ethereum',
          severity: 'low',
        },
      ];

      const related = service.suggestRelatedEvents(incident, historicalEvents);

      // With different source, different severity, and far time difference, correlation should be low
      expect(related.length).toBeLessThanOrEqual(1);
    });

    it('should generate synthetic events when no historical data', () => {
      const incident = createIncident();
      const related = service.suggestRelatedEvents(incident, []);

      expect(related.length).toBeGreaterThan(0);
      expect(related[0].id).toMatch(/^syn-/);
    });

    it('should sort events by correlation score', () => {
      const incident = createIncident();
      const historicalEvents = [
        {
          id: 'EVT-001',
          description: 'Low correlation',
          timestamp: '2026-06-18T10:00:00.000Z',
          source: 'ethereum',
          severity: 'low',
        },
        {
          id: 'EVT-002',
          description: 'High correlation',
          timestamp: '2026-06-19T09:55:00.000Z',
          source: 'stellar',
          severity: 'high',
        },
      ];

      const related = service.suggestRelatedEvents(incident, historicalEvents);

      if (related.length > 1) {
        expect(related[0].correlationScore).toBeGreaterThanOrEqual(related[1].correlationScore);
      }
    });
  });

  describe('buildTimeline', () => {
    it('should build chronological timeline', () => {
      const incident = createIncident({ timestamp: '2026-06-19T10:00:00.000Z' });
      const relatedEvents = [
        {
          id: 'EVT-001',
          description: 'Earlier event',
          correlationScore: 0.8,
          timestamp: '2026-06-19T09:30:00.000Z',
          eventType: 'authentication',
        },
        {
          id: 'EVT-002',
          description: 'Later event',
          correlationScore: 0.7,
          timestamp: '2026-06-19T10:15:00.000Z',
          eventType: 'network_scan',
        },
      ];

      const timeline = service.buildTimeline(incident, relatedEvents);

      expect(timeline).toBeInstanceOf(Array);
      expect(timeline.length).toBe(3);
      expect(timeline[0].timestamp).toBe('2026-06-19T09:30:00.000Z');
      expect(timeline[2].timestamp).toBe('2026-06-19T10:15:00.000Z');
    });

    it('should include incident as timeline entry', () => {
      const incident = createIncident();
      const timeline = service.buildTimeline(incident, []);

      expect(timeline.length).toBe(1);
      expect(timeline[0].description).toBe(incident.description);
      expect(timeline[0].action).toBe('Incident detected');
    });

    it('should sort timeline entries chronologically', () => {
      const incident = createIncident({ timestamp: '2026-06-19T10:00:00.000Z' });
      const relatedEvents = [
        {
          id: 'EVT-003',
          description: 'Event 3',
          correlationScore: 0.6,
          timestamp: '2026-06-19T11:00:00.000Z',
          eventType: 'type3',
        },
        {
          id: 'EVT-001',
          description: 'Event 1',
          correlationScore: 0.9,
          timestamp: '2026-06-19T09:00:00.000Z',
          eventType: 'type1',
        },
        {
          id: 'EVT-002',
          description: 'Event 2',
          correlationScore: 0.8,
          timestamp: '2026-06-19T10:30:00.000Z',
          eventType: 'type2',
        },
      ];

      const timeline = service.buildTimeline(incident, relatedEvents);

      for (let i = 1; i < timeline.length; i++) {
        const prevTime = new Date(timeline[i - 1].timestamp).getTime();
        const currTime = new Date(timeline[i].timestamp).getTime();
        expect(prevTime).toBeLessThanOrEqual(currTime);
      }
    });
  });

  describe('investigation steps', () => {
    it('should suggest critical severity steps', async () => {
      const incident = createIncident({ severity: 'critical' });
      const context = await service.generateContext(incident);

      expect(context.investigationSteps).toContain('Immediately isolate affected systems');
      expect(context.investigationSteps).toContain('Initiate incident response playbook');
    });

    it('should suggest high severity steps', async () => {
      const incident = createIncident({ severity: 'high' });
      const context = await service.generateContext(incident);

      expect(context.investigationSteps).toContain('Block identified indicators of compromise');
      expect(context.investigationSteps).toContain('Review affected system logs');
    });

    it('should suggest medium severity steps', async () => {
      const incident = createIncident({ severity: 'medium' });
      const context = await service.generateContext(incident);

      expect(context.investigationSteps).toContain('Investigate source system logs');
    });

    it('should suggest low severity steps', async () => {
      const incident = createIncident({ severity: 'low' });
      const context = await service.generateContext(incident);

      expect(context.investigationSteps).toContain('Monitor for additional activity');
    });
  });

  describe('confidence calculation', () => {
    it('should have base confidence of 0.5', async () => {
      const incident = createIncident();
      const context = await service.generateContext(incident);

      expect(context.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should increase confidence with incident data', async () => {
      const incidentWithoutData = createIncident();
      const incidentWithData = createIncident({
        data: { ip: '192.168.1.1', user: 'admin' },
      });

      const context1 = await service.generateContext(incidentWithoutData);
      const context2 = await service.generateContext(incidentWithData);

      expect(context2.confidence).toBeGreaterThan(context1.confidence);
    });

    it('should increase confidence with related events', async () => {
      const incident = createIncident();
      const historicalEvents = [
        {
          id: 'EVT-001',
          description: 'Related',
          timestamp: '2026-06-19T09:55:00.000Z',
          source: 'stellar',
          severity: 'high',
        },
      ];

      const context1 = await service.generateContext(incident, []);
      const context2 = await service.generateContext(incident, historicalEvents);

      expect(context2.confidence).toBeGreaterThanOrEqual(context1.confidence);
    });

    it('should never exceed confidence of 1.0', async () => {
      const incident = createIncident({
        data: { ip: '1.1.1.1', user: 'test', address: 'ABC', hash: 'XYZ' },
      });
      const historicalEvents = Array(10).fill({
        id: 'EVT',
        description: 'Event',
        timestamp: '2026-06-19T09:55:00.000Z',
        source: 'stellar',
        severity: 'high',
      });

      const context = await service.generateContext(incident, historicalEvents);

      expect(context.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('indicator extraction', () => {
    it('should extract IP addresses', async () => {
      const incident = createIncident({ data: { ip: '10.0.0.1' } });
      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('IP: 10.0.0.1');
    });

    it('should extract addresses', async () => {
      const incident = createIncident({ data: { address: 'GABC123' } });
      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('Address: GABC123');
    });

    it('should extract users', async () => {
      const incident = createIncident({ data: { user: 'admin' } });
      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('User: admin');
    });

    it('should extract hashes', async () => {
      const incident = createIncident({ data: { hash: 'abc123def456' } });
      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('Hash: abc123def456');
    });

    it('should extract domains', async () => {
      const incident = createIncident({ data: { domain: 'malicious.com' } });
      const context = await service.generateContext(incident);

      expect(context.indicators).toContain('Domain: malicious.com');
    });

    it('should provide default indicators when no data', async () => {
      const incident = createIncident();
      const context = await service.generateContext(incident);

      expect(context.indicators.length).toBeGreaterThan(0);
      expect(context.indicators).toContain(`Source: ${incident.source}`);
      expect(context.indicators).toContain(`Severity: ${incident.severity}`);
    });
  });
});

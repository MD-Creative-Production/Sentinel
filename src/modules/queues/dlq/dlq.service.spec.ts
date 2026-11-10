import { DlqService } from './dlq.service';

describe('DlqService', () => {
  let service: DlqService;

  beforeEach(() => {
    service = new DlqService();
  });

  afterEach(() => {
    service.clear();
  });

  describe('enqueueFailedJob', () => {
    it('captures failed jobs with payload, error metadata, and attempts', () => {
      const job = service.enqueueFailedJob({
        queueName: 'transaction-monitoring',
        jobName: 'audit-block-txs',
        payload: { txHash: '0xabc123', ledgerSeq: 10452 },
        error: new Error('Database connection timeout'),
        attempts: 3,
        maxAttempts: 3,
        metadata: { node: 'worker-1' },
      });

      expect(job.id).toBeDefined();
      expect(job.queueName).toBe('transaction-monitoring');
      expect(job.jobName).toBe('audit-block-txs');
      expect(job.status).toBe('failed');
      expect(job.error.message).toBe('Database connection timeout');
      expect(job.error.stack).toBeDefined();
      expect(job.attempts).toBe(3);
      expect(job.maxAttempts).toBe(3);
      expect(job.retryCount).toBe(0);
      expect(job.metadata).toEqual({ node: 'worker-1' });
    });

    it('handles non-Error objects as error payload safely', () => {
      const job = service.enqueueFailedJob({
        queueName: 'threat-feed',
        jobName: 'sync-indicators',
        payload: { feedId: 'misp-1' },
        error: { message: 'Network unreachable' },
      });

      expect(job.error.message).toBe('Network unreachable');
      expect(job.attempts).toBe(1);
      expect(job.maxAttempts).toBe(3);
    });
  });

  describe('getJob and listJobs', () => {
    beforeEach(() => {
      service.enqueueFailedJob({
        queueName: 'alerts-queue',
        jobName: 'dispatch-slack-alert',
        payload: { alertId: 'alt-1' },
        error: new Error('Rate limit exceeded'),
      });
      service.enqueueFailedJob({
        queueName: 'analytics-queue',
        jobName: 'compute-risk-score',
        payload: { account: 'GABC' },
        error: new Error('Out of memory'),
      });
    });

    it('retrieves an existing job by ID', () => {
      const all = service.listJobs();
      expect(all).toHaveLength(2);

      const job = service.getJob(all[0].id);
      expect(job).toBeDefined();
      expect(job?.id).toBe(all[0].id);
    });

    it('filters jobs by queueName', () => {
      const alertJobs = service.listJobs({ queueName: 'alerts-queue' });
      expect(alertJobs).toHaveLength(1);
      expect(alertJobs[0].queueName).toBe('alerts-queue');

      const analyticsJobs = service.listJobs({ queueName: 'analytics-queue' });
      expect(analyticsJobs).toHaveLength(1);
      expect(analyticsJobs[0].queueName).toBe('analytics-queue');
    });

    it('paginates results using limit and offset', () => {
      const page1 = service.listJobs({ limit: 1, offset: 0 });
      expect(page1).toHaveLength(1);

      const page2 = service.listJobs({ limit: 1, offset: 1 });
      expect(page2).toHaveLength(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('retryJob', () => {
    it('marks job as retried when external handler succeeds', async () => {
      const job = service.enqueueFailedJob({
        queueName: 'indexing',
        jobName: 'index-contract',
        payload: { contractId: 'CCONTRACT_ABC' },
        error: new Error('Transient 503 error'),
      });

      const mockRetryHandler = jest.fn().mockResolvedValue(true);
      const result = await service.retryJob(job.id, mockRetryHandler);

      expect(result.success).toBe(true);
      expect(result.job.status).toBe('retried');
      expect(result.job.retryCount).toBe(1);
      expect(result.job.lastRetriedAt).toBeDefined();
      expect(mockRetryHandler).toHaveBeenCalledWith(result.job);
    });

    it('keeps job as failed when retry handler returns false', async () => {
      const job = service.enqueueFailedJob({
        queueName: 'indexing',
        jobName: 'index-contract',
        payload: { contractId: 'CCONTRACT_ABC' },
        error: new Error('Service unavailable'),
      });

      const mockRetryHandler = jest.fn().mockResolvedValue(false);
      const result = await service.retryJob(job.id, mockRetryHandler);

      expect(result.success).toBe(false);
      expect(result.job.status).toBe('failed');
      expect(result.job.retryCount).toBe(1);
      expect(result.error).toBe('Retry handler returned false');
    });

    it('handles exceptions thrown by retry handler gracefully', async () => {
      const job = service.enqueueFailedJob({
        queueName: 'indexing',
        jobName: 'index-contract',
        payload: { contractId: 'CCONTRACT_ABC' },
        error: new Error('Initial failure'),
      });

      const mockRetryHandler = jest.fn().mockRejectedValue(new Error('Fatal crash during retry'));
      const result = await service.retryJob(job.id, mockRetryHandler);

      expect(result.success).toBe(false);
      expect(result.job.status).toBe('failed');
      expect(result.job.error.message).toBe('Fatal crash during retry');
    });

    it('throws NotFoundException for non-existent job ID', async () => {
      await expect(service.retryJob('non-existent-id')).rejects.toThrow();
    });
  });

  describe('discardJob', () => {
    it('marks job as discarded and records audit reason', () => {
      const job = service.enqueueFailedJob({
        queueName: 'webhook-delivery',
        jobName: 'dispatch-webhook',
        payload: { endpoint: 'http://malformed.url' },
        error: new Error('Malformed URL'),
      });

      const discarded = service.discardJob(job.id, 'Invalid endpoint URL cannot be delivered');
      expect(discarded.status).toBe('discarded');
      expect(discarded.discardReason).toBe('Invalid endpoint URL cannot be delivered');
    });
  });

  describe('getMetrics', () => {
    it('computes accurate status counts and per-queue breakdown', async () => {
      const j1 = service.enqueueFailedJob({
        queueName: 'q1',
        jobName: 'j1',
        payload: {},
        error: new Error('e1'),
      });
      const j2 = service.enqueueFailedJob({
        queueName: 'q1',
        jobName: 'j2',
        payload: {},
        error: new Error('e2'),
      });
      service.enqueueFailedJob({
        queueName: 'q2',
        jobName: 'j3',
        payload: {},
        error: new Error('e3'),
      });

      await service.retryJob(j1.id);
      service.discardJob(j2.id, 'Unrecoverable');

      const metrics = service.getMetrics();
      expect(metrics.totalFailed).toBe(3);
      expect(metrics.pending).toBe(1);
      expect(metrics.retried).toBe(1);
      expect(metrics.discarded).toBe(1);

      expect(metrics.byQueue['q1']).toEqual({
        total: 2,
        pending: 0,
        retried: 1,
        discarded: 1,
      });
      expect(metrics.byQueue['q2']).toEqual({
        total: 1,
        pending: 1,
        retried: 0,
        discarded: 0,
      });
    });
  });

  describe('purge', () => {
    it('purges retried and discarded jobs older than the cutoff threshold', () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const job1 = service.enqueueFailedJob({
        queueName: 'q1',
        jobName: 'j1',
        payload: {},
        error: new Error('e1'),
      });
      job1.failedAt = oldDate;
      job1.status = 'retried';

      const job2 = service.enqueueFailedJob({
        queueName: 'q1',
        jobName: 'j2',
        payload: {},
        error: new Error('e2'),
      });
      job2.failedAt = new Date(); // Recent

      const purged = service.purge(7 * 24 * 60 * 60 * 1000); // 7 days
      expect(purged).toBe(1);
      expect(service.getJob(job1.id)).toBeUndefined();
      expect(service.getJob(job2.id)).toBeDefined();
    });
  });
});

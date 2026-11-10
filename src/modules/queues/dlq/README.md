# Dead Letter Queue (DLQ) Module

The Dead Letter Queue (DLQ) module captures, stores, monitors, and recovers failed jobs across Sentinel queues, preventing silent job loss and enabling controlled remediation.

## Overview

When background workers encounter terminal failures or exceed maximum retry thresholds, jobs are routed into the DLQ. This enables engineering and security teams to:
- **Inspect**: Review full payloads, stack traces, and execution attempt counts without logs rolling off.
- **Retry**: Re-dispatch jobs manually or through automated remediation handlers.
- **Audit & Discard**: Mark unrecoverable or invalid jobs as discarded with documented reasons.
- **Monitor**: Surface pending failure backlogs and error rates by queue.

## Architecture

- **`interfaces/dlq.interface.ts`**: Types for job payloads, statuses (`failed`, `retrying`, `retried`, `discarded`), filters, and metrics.
- **`dlq.service.ts`**: In-memory and extensible storage engine implementing `enqueueFailedJob`, `listJobs`, `retryJob`, `discardJob`, `getMetrics`, and `purge`.
- **`dlq.module.ts`**: NestJS module providing `DlqService` for injection across queue producers and consumers.

## Usage

### Enqueue a Failed Job

```typescript
import { DlqService } from './dlq.service';

dlqService.enqueueFailedJob({
  queueName: 'transaction-monitoring',
  jobName: 'audit-block-txs',
  payload: { txHash: '0x123...' },
  error: new Error('RPC endpoint unavailable'),
  attempts: 3,
  maxAttempts: 3,
  metadata: { workerId: 'worker-a' },
});
```

### Retry Controls

```typescript
// Retry with custom execution logic
const result = await dlqService.retryJob(jobId, async (job) => {
  return await dispatchToWorker(job.payload);
});

if (result.success) {
  console.log('Job recovered successfully');
}
```

### Metrics & Monitoring

```typescript
const metrics = dlqService.getMetrics();
console.log(`Pending failures: ${metrics.pending}, Total: ${metrics.totalFailed}`);
```

## Testing

Run unit tests via Jest:

```bash
npx jest src/modules/queues/dlq/dlq.service.spec.ts
```

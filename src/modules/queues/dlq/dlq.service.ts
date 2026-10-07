import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DeadLetterJob,
  DlqFilter,
  DlqMetrics,
  EnqueueFailedJobOptions,
  RetryResult,
} from './interfaces/dlq.interface';

@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);
  private readonly jobs = new Map<string, DeadLetterJob>();

  /**
   * Capture a failed job into the Dead Letter Queue for investigation and recovery.
   */
  enqueueFailedJob<T = any>(options: EnqueueFailedJobOptions<T>): DeadLetterJob<T> {
    const id = options.id || randomUUID();
    const errObj =
      options.error instanceof Error
        ? {
            message: options.error.message,
            name: options.error.name,
            stack: options.error.stack,
          }
        : {
            message: options.error.message || 'Unknown failure',
            name: options.error.name,
            stack: options.error.stack,
          };

    const job: DeadLetterJob<T> = {
      id,
      queueName: options.queueName,
      jobName: options.jobName,
      payload: options.payload,
      error: errObj,
      attempts: options.attempts || 1,
      maxAttempts: options.maxAttempts || 3,
      failedAt: new Date(),
      status: 'failed',
      retryCount: 0,
      metadata: options.metadata || {},
    };

    this.jobs.set(id, job);
    this.logger.warn(
      `Job [${job.id}] from queue [${job.queueName}] routed to DLQ. Reason: ${job.error.message}`,
    );

    return job;
  }

  /**
   * Retrieve a single dead-letter job by ID.
   */
  getJob(id: string): DeadLetterJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * List dead-letter jobs with optional filtering and pagination.
   */
  listJobs(filter?: DlqFilter): DeadLetterJob[] {
    let result = Array.from(this.jobs.values());

    if (filter?.queueName) {
      result = result.filter((j) => j.queueName === filter.queueName);
    }

    if (filter?.status) {
      result = result.filter((j) => j.status === filter.status);
    }

    // Sort newest first
    result.sort((a, b) => b.failedAt.getTime() - a.failedAt.getTime());

    const offset = filter?.offset || 0;
    const limit = filter?.limit || result.length;

    return result.slice(offset, offset + limit);
  }

  /**
   * Execute retry controls on a failed job.
   * Invokes the optional handler; on success, marks the job as retried.
   */
  async retryJob(
    id: string,
    retryHandler?: (job: DeadLetterJob) => Promise<boolean>,
  ): Promise<RetryResult> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`Dead Letter Job with id ${id} not found`);
    }

    job.status = 'retrying';
    job.retryCount += 1;
    job.lastRetriedAt = new Date();

    try {
      if (retryHandler) {
        const success = await retryHandler(job);
        if (success) {
          job.status = 'retried';
          this.logger.log(`Job [${job.id}] successfully retried and recovered.`);
          return { success: true, job };
        } else {
          job.status = 'failed';
          this.logger.warn(`Job [${job.id}] retry handler returned failure.`);
          return { success: false, job, error: 'Retry handler returned false' };
        }
      } else {
        // Without an external handler, mark as retried for manual dispatch
        job.status = 'retried';
        return { success: true, job };
      }
    } catch (err: any) {
      job.status = 'failed';
      job.error = {
        message: err.message || 'Retry failed',
        name: err.name,
        stack: err.stack,
      };
      this.logger.error(`Job [${job.id}] retry threw error: ${err.message}`);
      return { success: false, job, error: err.message };
    }
  }

  /**
   * Explicitly discard a failed job from active retry consideration with an audit reason.
   */
  discardJob(id: string, reason: string = 'Manually discarded'): DeadLetterJob {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`Dead Letter Job with id ${id} not found`);
    }

    job.status = 'discarded';
    job.discardReason = reason;
    this.logger.log(`Job [${job.id}] marked as discarded. Reason: ${reason}`);
    return job;
  }

  /**
   * Aggregate monitoring and observability metrics across queues.
   */
  getMetrics(): DlqMetrics {
    const metrics: DlqMetrics = {
      totalFailed: 0,
      pending: 0,
      retried: 0,
      discarded: 0,
      byQueue: {},
    };

    for (const job of this.jobs.values()) {
      metrics.totalFailed += 1;

      if (!metrics.byQueue[job.queueName]) {
        metrics.byQueue[job.queueName] = {
          total: 0,
          pending: 0,
          retried: 0,
          discarded: 0,
        };
      }

      const q = metrics.byQueue[job.queueName];
      q.total += 1;

      if (job.status === 'failed' || job.status === 'retrying') {
        metrics.pending += 1;
        q.pending += 1;
      } else if (job.status === 'retried') {
        metrics.retried += 1;
        q.retried += 1;
      } else if (job.status === 'discarded') {
        metrics.discarded += 1;
        q.discarded += 1;
      }
    }

    return metrics;
  }

  /**
   * Purge resolved or discarded jobs older than the retention threshold.
   */
  purge(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let purged = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'retried' || job.status === 'discarded') &&
        job.failedAt.getTime() < cutoff
      ) {
        this.jobs.delete(id);
        purged += 1;
      }
    }

    if (purged > 0) {
      this.logger.log(`Purged ${purged} expired jobs from DLQ storage.`);
    }

    return purged;
  }

  /**
   * Clear all jobs (useful for testing teardown).
   */
  clear(): void {
    this.jobs.clear();
  }
}

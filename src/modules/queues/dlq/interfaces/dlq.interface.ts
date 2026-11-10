export type JobStatus = 'failed' | 'retrying' | 'retried' | 'discarded';

export interface DeadLetterJob<T = any> {
  id: string;
  queueName: string;
  jobName: string;
  payload: T;
  error: {
    message: string;
    name?: string;
    stack?: string;
  };
  attempts: number;
  maxAttempts: number;
  failedAt: Date;
  status: JobStatus;
  retryCount: number;
  lastRetriedAt?: Date;
  discardReason?: string;
  metadata?: Record<string, any>;
}

export interface EnqueueFailedJobOptions<T = any> {
  id?: string;
  queueName: string;
  jobName: string;
  payload: T;
  error: Error | { message: string; name?: string; stack?: string };
  attempts?: number;
  maxAttempts?: number;
  metadata?: Record<string, any>;
}

export interface DlqFilter {
  queueName?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

export interface QueueMetricBreakdown {
  total: number;
  pending: number;
  retried: number;
  discarded: number;
}

export interface DlqMetrics {
  totalFailed: number;
  pending: number;
  retried: number;
  discarded: number;
  byQueue: Record<string, QueueMetricBreakdown>;
}

export interface RetryResult {
  success: boolean;
  job: DeadLetterJob;
  error?: string;
}

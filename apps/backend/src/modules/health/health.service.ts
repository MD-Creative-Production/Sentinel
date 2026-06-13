import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DependencyHealthResult,
  HealthCheckResult,
  HealthStatus,
} from './interfaces/health-check.interface';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResult> {
    const dependencies: Record<string, DependencyHealthResult> = {};

    dependencies.database = await this.checkDatabase();

    // Determine overall status — down if any dependency is down
    const overallStatus: HealthStatus = Object.values(dependencies).every(d => d.status === 'up')
      ? 'up'
      : 'down';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '1.0.0',
      dependencies,
    };
  }

  // ---------------------------------------------------------------------------
  // Dependency checks
  // ---------------------------------------------------------------------------

  private async checkDatabase(): Promise<DependencyHealthResult> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', responseTimeMs: Date.now() - start };
    } catch (error) {
      this.logger.error(`Database health check failed: ${String(error)}`);
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

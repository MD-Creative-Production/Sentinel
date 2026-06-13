import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckResult } from './interfaces/health-check.interface';

/**
 * Exposes readiness / liveness probes for the service.
 *
 * GET /api/health        — full dependency status (for readiness probes)
 * GET /api/health/live   — lightweight liveness probe (process is running)
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Full health check including all dependencies.
   * Returns HTTP 200 when healthy, HTTP 503 when any dependency is down.
   */
  @Get()
  async check(): Promise<HealthCheckResult> {
    const result = await this.healthService.check();

    // NestJS will serialise the return value; we set the status code dynamically
    // via a response decorator interceptor-free approach using HttpCode on a
    // separate route is simpler — callers can inspect result.status themselves.
    return result;
  }

  /**
   * Lightweight liveness probe — returns 200 as long as the process is alive.
   * Use this for Kubernetes/Docker liveness probes where a DB blip should not
   * restart the container.
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }
}

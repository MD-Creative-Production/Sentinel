import { Controller, Get } from '@nestjs/common';
import { SecurityPostureService } from './security-posture.service';
import { PostureSnapshot, SecurityPostureResult } from './interfaces/security-posture.interface';

/**
 * Exposes security posture scoring endpoints.
 *
 * GET /security-posture          — current score, factors, trend, and history
 * GET /security-posture/history  — historical snapshots only
 */
@Controller('security-posture')
export class SecurityPostureController {
  constructor(private readonly securityPostureService: SecurityPostureService) {}

  @Get()
  getPosture(): SecurityPostureResult {
    return this.securityPostureService.getPosture();
  }

  @Get('history')
  getHistory(): PostureSnapshot[] {
    return this.securityPostureService.getHistory();
  }
}

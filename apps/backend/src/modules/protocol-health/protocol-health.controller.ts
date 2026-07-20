import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ProtocolHealthService } from './protocol-health.service';
import {
  HealthSnapshotResponse,
  ProtocolHealthAlertResponse,
} from './interfaces/protocol-health-metric.interface';

@Controller('protocol-health')
export class ProtocolHealthController {
  constructor(private readonly protocolHealthService: ProtocolHealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllChainsHealth(): Promise<HealthSnapshotResponse[]> {
    return this.protocolHealthService.getAllChainsHealth();
  }

  @Get(':chainId')
  @HttpCode(HttpStatus.OK)
  async getChainHealth(@Param('chainId') chainId: string): Promise<HealthSnapshotResponse> {
    return this.protocolHealthService.getHealthSnapshot(chainId);
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  async getAlerts(@Query('chainId') chainId?: string): Promise<ProtocolHealthAlertResponse[]> {
    return this.protocolHealthService.getAlerts(chainId);
  }
}

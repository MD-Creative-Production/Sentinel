import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ProtocolAlert,
  ProtocolHealthSnapshot,
  RecordMetricDto,
  RegisterProtocolDto,
} from './interfaces/protocol-health.interface';
import { ProtocolHealthService } from './protocol-health.service';

@Controller('protocols/health')
export class ProtocolHealthController {
  constructor(private readonly service: ProtocolHealthService) {}

  @Post('register')
  register(@Body() dto: RegisterProtocolDto): ProtocolHealthSnapshot {
    return this.service.registerProtocol(dto);
  }

  @Post('metrics')
  recordMetrics(@Body() dto: RecordMetricDto): ProtocolHealthSnapshot {
    return this.service.recordMetrics(dto);
  }

  @Get()
  getAll(): ProtocolHealthSnapshot[] {
    return this.service.getAllProtocols();
  }

  // 'alerts' must be declared before ':protocolId' to prevent path shadowing
  @Get('alerts')
  getAlerts(): ProtocolAlert[] {
    return this.service.getActiveAlerts();
  }

  @Get(':protocolId')
  getOne(@Param('protocolId') protocolId: string): ProtocolHealthSnapshot {
    return this.service.getProtocolHealth(protocolId);
  }
}

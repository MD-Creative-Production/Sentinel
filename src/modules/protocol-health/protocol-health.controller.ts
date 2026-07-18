import { Controller, Get, Param } from '@nestjs/common';
import { ProtocolHealthService } from './protocol-health.service';

@Controller('protocol-health')
export class ProtocolHealthController {
  constructor(private readonly protocolHealthService: ProtocolHealthService) {}

  @Get(':protocol')
  checkHealth(@Param('protocol') protocol: string) {
    return this.protocolHealthService.checkHealth(protocol);
  }
}
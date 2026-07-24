import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ForwardSentinelEventDto } from './dto/forward-sentinel-event.dto';

import { SplunkService } from './splunk.service';

@Controller('integrations/splunk')
export class SplunkController {
  constructor(private readonly splunkService: SplunkService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  async forwardEvent(
    @Body()
    event: ForwardSentinelEventDto,
  ) {
    await this.splunkService.forwardEvent(event);

    return {
      success: true,

      message: 'Sentinel event delivered to Splunk',
    };
  }
}

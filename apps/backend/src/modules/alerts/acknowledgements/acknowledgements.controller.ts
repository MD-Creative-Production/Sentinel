import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AcknowledgementsService } from './acknowledgements.service';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';

@Controller('alerts')
export class AcknowledgementsController {
  constructor(private readonly acknowledgementsService: AcknowledgementsService) {}

  /**
   * Endpoint to acknowledge an alert.
   *
   * @param id The ID of the alert to acknowledge
   * @param dto The acknowledgement payload
   */
  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  async acknowledgeAlert(@Param('id') id: string, @Body() dto: AcknowledgeAlertDto) {
    return this.acknowledgementsService.acknowledgeAlert(id, dto);
  }
}

import { Body, Controller, Post } from '@nestjs/common';

import { SummariesService } from './summaries.service';
import { CreateSummaryDto } from './dto/create-summary.dto';

@Controller('ai/summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post()
  generateSummary(@Body() createSummaryDto: CreateSummaryDto) {
    return this.summariesService.generateSummary(createSummaryDto);
  }
}

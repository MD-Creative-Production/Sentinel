import { Module } from '@nestjs/common';
import { AlertSummaryService } from './summaries';

@Module({
  providers: [AlertSummaryService],
  exports: [AlertSummaryService],
})
export class AiModule {}

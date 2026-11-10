import { Module } from '@nestjs/common';
import { DlqService } from './dlq.service';

@Module({
  providers: [DlqService],
  exports: [DlqService],
})
export class DlqModule {}

import { Module } from '@nestjs/common';
import { SpikeDetectionService } from './spike-detection.service';

@Module({
  providers: [SpikeDetectionService],
  exports: [SpikeDetectionService],
})
export class SpikeDetectionModule {}

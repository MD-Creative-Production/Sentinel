import { Module } from '@nestjs/common';
import { BehavioralAnalysisService } from './behavioral-analysis.service';

@Module({
  providers: [BehavioralAnalysisService],
  exports: [BehavioralAnalysisService],
})
export class BehavioralAnalysisModule {}

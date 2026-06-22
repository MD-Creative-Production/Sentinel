import { Module } from '@nestjs/common';
import { RiskAnalyzerController } from './risk-analyzer.controller';
import { RiskAnalyzerService } from './risk-analyzer.service';

@Module({
  controllers: [RiskAnalyzerController],
  providers: [RiskAnalyzerService],
  exports: [RiskAnalyzerService],
})
export class RiskAnalyzerModule {}

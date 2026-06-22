import { Body, Controller, Post } from '@nestjs/common';
import { RiskAnalyzerService } from './risk-analyzer.service';
import { AnalyzeContractDto, RiskAnalysisResult } from './interfaces/risk-analyzer.interface';

/**
 * REST API for the Soroban Contract Risk Analyzer.
 *
 * POST /soroban/risk/analyze  — analyze a contract against known risk patterns
 */
@Controller('soroban/risk')
export class RiskAnalyzerController {
  constructor(private readonly riskAnalyzerService: RiskAnalyzerService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeContractDto): RiskAnalysisResult {
    return this.riskAnalyzerService.analyzeContract(dto);
  }
}

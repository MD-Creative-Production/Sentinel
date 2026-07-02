import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('alerts')
  getAlertMetrics() {
    return this.analyticsService.getAlertMetrics();
  }

  @Get('watchlists')
  getWatchlistMetrics() {
    return this.analyticsService.getWatchlistMetrics();
  }

  @Get('risk')
  getRiskMetrics() {
    return this.analyticsService.getRiskMetrics();
  }
}

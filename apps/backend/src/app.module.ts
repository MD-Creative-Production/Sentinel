import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../../../database/database.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { DependencyTrackerModule } from './modules/contracts/dependencies/dependency-tracker.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { SiemModule } from './integrations/siem/siem.module';
import { ChainsModule } from './modules/chains/chains.module';
import { RiskAnalyzerModule } from './modules/soroban/risk/risk-analyzer.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    NotificationsModule,
    ReportingModule,
    DependencyTrackerModule,
    GovernanceModule,
    SiemModule,
    ChainsModule,
    RiskAnalyzerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

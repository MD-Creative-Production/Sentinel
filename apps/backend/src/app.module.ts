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
import { NotesModule } from './modules/cases/notes/notes.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ProtocolHealthModule } from './modules/protocol-health/protocol-health.module';

import { ReportsModule } from '../../../src/modules/reports/reports.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PrismaModule } from './database/prisma.module';
import { IncidentsModule } from './modules/incidents/incidents.module';

@Module({
  imports: [
    DatabaseModule,
    PrismaModule,
    HealthModule,
    NotificationsModule,
    ReportingModule,
    ReportsModule,
    DependencyTrackerModule,
    GovernanceModule,
    SiemModule,
    ChainsModule,
    RiskAnalyzerModule,
    NotesModule,
    AlertsModule,
    ProfileModule,
    IncidentsModule,
    ProtocolHealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

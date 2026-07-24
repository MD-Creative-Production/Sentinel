/**
 * src/modules/reputation/reputation.module.ts
 *
 * Wiring notes for whoever merges this:
 * 1. Replace the two placeholder providers (CHAIN_DATA_PROVIDER,
 *    INCIDENT_DATA_PROVIDER) with real adapters over ChainsService and
 *    IncidentsService/CasesService respectively. Stub implementations
 *    are provided so the module boots and is testable in isolation.
 * 2. Replace SANCTIONS_LIST_PROVIDER with a real adapter over whatever
 *    sanctioned-address / mixer-detection source the platform uses
 *    (behavioral-analysis module or an external feed).
 * 3. Add `ReputationScore` to prisma/schema.prisma (see
 *    prisma/reputation.prisma.snippet) and run a migration before this
 *    module is used against a real database.
 */
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReputationController } from './reputation.controller';
import { ReputationService, CHAIN_DATA_PROVIDER, INCIDENT_DATA_PROVIDER } from './reputation.service';
import { ReputationCalculatorService } from './services/reputation-calculator.service';
import { RiskIndicatorService, SANCTIONS_LIST_PROVIDER } from './services/risk-indicator.service';
import { ReputationRepository } from './repository/reputation.repository';
import { StubChainDataProvider } from './providers/stub-chain-data.provider';
import { StubIncidentDataProvider } from './providers/stub-incident-data.provider';
import { StubSanctionsListProvider } from './providers/stub-sanctions-list.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [ReputationController],
  providers: [
    ReputationService,
    ReputationCalculatorService,
    RiskIndicatorService,
    ReputationRepository,
    { provide: CHAIN_DATA_PROVIDER, useClass: StubChainDataProvider },
    { provide: INCIDENT_DATA_PROVIDER, useClass: StubIncidentDataProvider },
    { provide: SANCTIONS_LIST_PROVIDER, useClass: StubSanctionsListProvider },
  ],
  exports: [ReputationService],
})
export class ReputationModule {}

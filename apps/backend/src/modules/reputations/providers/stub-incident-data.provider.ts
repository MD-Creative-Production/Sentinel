/**
 * src/modules/reputation/providers/stub-incident-data.provider.ts
 *
 * TEMPORARY. Replace with a real adapter over the `cases` and
 * `incidents` modules so wallet incident/fraud history feeds into the
 * score. See PR description for the exact integration points expected.
 */
import { Injectable, Logger } from '@nestjs/common';
import { IncidentDataProvider } from '../reputation.service';
import { WalletIncidentSummary } from '../interfaces/reputation.interfaces';

@Injectable()
export class StubIncidentDataProvider implements IncidentDataProvider {
  private readonly logger = new Logger(StubIncidentDataProvider.name);

  async getIncidentSummary(walletAddress: string): Promise<WalletIncidentSummary> {
    this.logger.warn(
      `StubIncidentDataProvider in use for ${walletAddress} — wire up the real CasesService/IncidentsService before deploying.`,
    );

    return {
      walletAddress,
      openIncidents: 0,
      resolvedIncidents: 0,
      confirmedFraudCases: 0,
      lastIncidentAt: null,
    };
  }
}

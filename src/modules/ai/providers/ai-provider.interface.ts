import { ThreatSummary } from '../interfaces/threat-summary.interface';

export interface AIProvider {
  name: string;
  analyzeThreat(event: unknown): Promise<ThreatSummary>;
  healthCheck?(): Promise<boolean>;
}

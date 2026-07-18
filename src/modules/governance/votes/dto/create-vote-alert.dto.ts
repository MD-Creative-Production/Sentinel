import { AlertSeverity } from '../enums/alert-severity.enum';

export class CreateVoteAlertDto {
  proposalId!: string;
  chainId!: number;
  proposalTitle!: string;
  alertType!: string;
  severity?: AlertSeverity;
  outcome?: string;
  message!: string;
  proposalLink?: string;
  network?: string;
  metadata?: Record<string, unknown>;
}

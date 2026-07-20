import { Logger } from '../../../utils/logger';
import { TreasuryPolicyRepository } from './treasury-policy.repository';
import { TreasuryPolicyService } from './treasury-policy.service';
import { ITreasuryPolicyScheduler } from './interfaces/treasury-policy-service.interface';
import { TreasuryPolicyConfig } from './interfaces/treasury-policy-config.interface';

export class TreasuryPolicyScheduler implements ITreasuryPolicyScheduler {
  private logger: Logger;
  private running = false;
  private intervals: Map<number, ReturnType<typeof setInterval>> = new Map();
  private defaultPollInterval = 60000;

  constructor(
    private policyService: TreasuryPolicyService,
    private policyRepository: TreasuryPolicyRepository,
    private configs: TreasuryPolicyConfig[],
  ) {
    this.logger = new Logger('TreasuryPolicyScheduler');
  }

  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('Scheduler is already running');
      return;
    }

    this.logger.info('Starting treasury policy scheduler');

    for (const config of this.configs) {
      if (config.enabled !== false) {
        await this.startMonitoring(config);
      }
    }

    this.running = true;
    this.logger.info('Treasury policy scheduler started');
  }

  async stop(): Promise<void> {
    if (!this.running) {
      this.logger.warn('Scheduler is not running');
      return;
    }

    this.logger.info('Stopping treasury policy scheduler');

    for (const [chainId, interval] of this.intervals) {
      clearInterval(interval);
      this.logger.debug(`Stopped monitoring for chain ${chainId}`);
    }

    this.intervals.clear();
    this.running = false;
    this.logger.info('Treasury policy scheduler stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  private async startMonitoring(config: TreasuryPolicyConfig): Promise<void> {
    const pollInterval = config.pollIntervalMs || this.defaultPollInterval;

    this.logger.info(
      `Starting monitoring for wallet ${config.walletAddress} on chain ${config.chainId} with interval ${pollInterval}ms`,
    );

    const interval = setInterval(async () => {
      try {
        await this.monitorWallet(config);
      } catch (error) {
        this.logger.error(
          `Error monitoring wallet ${config.walletAddress} on chain ${config.chainId}`,
          error,
        );
      }
    }, pollInterval);

    this.intervals.set(config.chainId, interval);
  }

  private async monitorWallet(config: TreasuryPolicyConfig): Promise<void> {
    this.logger.debug(`Monitoring wallet ${config.walletAddress} on chain ${config.chainId}`);

    const policies = await this.policyRepository.getActivePolicies(
      config.walletAddress,
      config.chainId,
    );

    if (policies.length === 0) {
      this.logger.debug(`No active policies for wallet ${config.walletAddress}`);
      return;
    }

    this.logger.debug(
      `Found ${policies.length} active policies for wallet ${config.walletAddress}`,
    );

    await this.processUnsentAlerts();
  }

  private async processUnsentAlerts(): Promise<void> {
    try {
      const unsentAlerts = await this.policyRepository.getUnsentAlerts();

      if (unsentAlerts.length === 0) {
        return;
      }

      this.logger.info(`Processing ${unsentAlerts.length} unsent alerts`);

      for (const alert of unsentAlerts) {
        try {
          await this.sendAlert(alert);
          await this.policyRepository.markAlertSent(alert.id);
        } catch (error) {
          this.logger.error(`Failed to send alert for violation ${alert.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error processing unsent alerts', error);
    }
  }

  private async sendAlert(violation: any): Promise<void> {
    this.logger.info(
      `Sending alert for violation ${violation.id} - policy: ${violation.policyName}, rule: ${violation.violatedRule}`,
    );
  }
}

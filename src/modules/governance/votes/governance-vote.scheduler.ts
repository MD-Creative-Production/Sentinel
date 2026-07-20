import { Logger } from '../../../utils/logger';
import { GovernanceVoteService } from './governance-vote.service';
import { GovernanceVoteProcessor } from './governance-vote.processor';
import { IGovernanceVoteScheduler } from './interfaces/governance-vote-service.interface';

export class GovernanceVoteScheduler implements IGovernanceVoteScheduler {
  private logger: Logger;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunningFlag: boolean = false;

  constructor(
    private voteService: GovernanceVoteService,
    private voteProcessor: GovernanceVoteProcessor,
    private pollIntervalMs: number = 60000,
  ) {
    this.logger = new Logger('GovernanceVoteScheduler');
  }

  async start(): Promise<void> {
    if (this.isRunningFlag) {
      this.logger.warn('Scheduler is already running');
      return;
    }

    this.logger.info(`Starting governance vote scheduler with ${this.pollIntervalMs}ms interval`);

    this.isRunningFlag = true;

    await this.runMonitoringCycle();

    this.intervalId = setInterval(async () => {
      try {
        await this.runMonitoringCycle();
      } catch (error) {
        this.logger.error('Error in monitoring cycle', error);
      }
    }, this.pollIntervalMs);

    this.logger.info('Governance vote scheduler started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      this.logger.warn('Scheduler is not running');
      return;
    }

    this.logger.info('Stopping governance vote scheduler');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunningFlag = false;

    this.logger.info('Governance vote scheduler stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  private async runMonitoringCycle(): Promise<void> {
    this.logger.info('Starting monitoring cycle');

    try {
      const results = await this.voteService.monitorProposals();
      this.logger.info(`Monitoring cycle completed: ${results.length} proposals checked`);

      if (results.length > 0) {
        await this.voteProcessor.processVoteResults(results);
      }
    } catch (error) {
      this.logger.error('Monitoring cycle failed', error);
      throw error;
    }
  }
}

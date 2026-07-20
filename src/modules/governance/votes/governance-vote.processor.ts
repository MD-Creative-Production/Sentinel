import { Logger } from '../../../utils/logger';
import { GovernanceVoteRepository } from './governance-vote.repository';
import { VoteMonitoringResult } from './interfaces';
import { IGovernanceVoteProcessor } from './interfaces/governance-vote-service.interface';
import { generateAlertForOutcome } from './alerts/alert-generator.util';

export class GovernanceVoteProcessor implements IGovernanceVoteProcessor {
  private logger: Logger;

  constructor(private voteRepository: GovernanceVoteRepository) {
    this.logger = new Logger('GovernanceVoteProcessor');
  }

  async processVoteResult(result: VoteMonitoringResult): Promise<void> {
    this.logger.debug(`Processing vote result for proposal ${result.proposalId}`);

    if (!result.stateChanged && !result.votesUpdated) {
      this.logger.debug(`No changes detected for proposal ${result.proposalId}, skipping`);
      return;
    }

    if (result.stateChanged) {
      await this.handleStateChange(result);
    }

    if (result.votesUpdated) {
      await this.handleVoteUpdate(result);
    }

    await this.voteRepository.markAsProcessed(result.proposalId, result.chainId);
  }

  async processVoteResults(results: VoteMonitoringResult[]): Promise<void> {
    this.logger.info(`Processing ${results.length} vote results`);

    for (const result of results) {
      try {
        await this.processVoteResult(result);
      } catch (error) {
        this.logger.error(`Failed to process vote result for proposal ${result.proposalId}`, error);
      }
    }

    this.logger.info(`Completed processing ${results.length} vote results`);
  }

  private async handleStateChange(result: VoteMonitoringResult): Promise<void> {
    this.logger.info(
      `State changed for proposal ${result.proposalId}: ${result.previousOutcome} -> ${result.currentOutcome}`,
    );

    const voteOutcome = await this.voteRepository.findVoteOutcome(
      result.proposalId,
      result.chainId,
    );

    if (!voteOutcome) {
      this.logger.warn(`Vote outcome not found for proposal ${result.proposalId}`);
      return;
    }

    const alert = generateAlertForOutcome(
      result.proposalId,
      result.chainId,
      voteOutcome.proposalTitle,
      result.currentOutcome,
      voteOutcome.proposalImpact,
      voteOutcome.proposalLink,
    );

    if (alert) {
      await this.voteRepository.createAlert(alert);
      this.logger.info(`Generated alert for proposal ${result.proposalId}: ${alert.alertType}`);
    }
  }

  private async handleVoteUpdate(result: VoteMonitoringResult): Promise<void> {
    this.logger.debug(`Votes updated for proposal ${result.proposalId}`);
  }
}

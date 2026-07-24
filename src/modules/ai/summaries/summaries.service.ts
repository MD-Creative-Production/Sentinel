import { Injectable } from '@nestjs/common';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { AlertSummary } from './interfaces/alert-summary.interface';

@Injectable()
export class SummariesService {
  generateSummary(alert: CreateSummaryDto): AlertSummary {
    const summary = this.createAlertSummary(alert);

    const riskExplanation = this.createRiskExplanation(alert);

    const recommendedActions = this.createRecommendations(alert);

    return {
      summary,
      riskExplanation,
      recommendedActions,
    };
  }

  private createAlertSummary(alert: CreateSummaryDto): string {
    const amountInformation =
      alert.amount && alert.asset ? ` involving ${alert.amount} ${alert.asset}` : '';

    return `A ${alert.severity.toLowerCase()}-severity ${alert.alertType.toLowerCase()} alert was detected${amountInformation}. ${alert.description}`;
  }

  private createRiskExplanation(alert: CreateSummaryDto): string {
    switch (alert.severity.toUpperCase()) {
      case 'CRITICAL':
        return (
          'This alert represents a critical risk and may indicate malicious activity, ' +
          'significant financial exposure, or a serious security issue. Immediate investigation ' +
          'and appropriate containment measures are recommended.'
        );

      case 'HIGH':
        return (
          'This alert represents a high level of risk. The detected activity may indicate ' +
          'suspicious behavior or potential financial or security exposure. The transaction ' +
          'and associated entities should be investigated promptly.'
        );

      case 'MEDIUM':
        return (
          'This alert represents a moderate level of risk. The activity may be unusual ' +
          'or inconsistent with expected behavior and should be reviewed to determine whether ' +
          'further action is necessary.'
        );

      case 'LOW':
        return (
          'This alert represents a low level of risk. The activity is potentially noteworthy ' +
          'but does not currently indicate a significant threat. Continued monitoring is recommended.'
        );

      default:
        return (
          'The risk level could not be determined automatically. The alert should be reviewed ' +
          'using the available transaction and contextual information.'
        );
    }
  }

  private createRecommendations(alert: CreateSummaryDto): string[] {
    const recommendations: string[] = [];

    switch (alert.severity.toUpperCase()) {
      case 'CRITICAL':
        recommendations.push('Immediately investigate the alert and associated transaction.');

        recommendations.push('Consider temporarily restricting or monitoring the affected wallet.');

        recommendations.push('Review related transactions and connected wallet addresses.');

        recommendations.push('Escalate the incident to the security or compliance team.');

        break;

      case 'HIGH':
        recommendations.push(
          'Investigate the transaction and verify the legitimacy of the activity.',
        );

        recommendations.push('Review the wallet history and related transactions.');

        recommendations.push('Monitor the affected wallet for additional suspicious activity.');

        break;

      case 'MEDIUM':
        recommendations.push(
          'Review the alert and compare the activity against expected behavior.',
        );

        recommendations.push('Monitor the associated wallet and transactions.');

        recommendations.push(
          'Escalate for further investigation if additional suspicious activity is detected.',
        );

        break;

      case 'LOW':
        recommendations.push('Continue monitoring the associated wallet or transaction.');

        recommendations.push('Review the alert if similar activity occurs repeatedly.');

        break;

      default:
        recommendations.push(
          'Review the alert details and determine whether further investigation is required.',
        );
    }

    return recommendations;
  }
}

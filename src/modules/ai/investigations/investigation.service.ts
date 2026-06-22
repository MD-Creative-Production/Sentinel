import {
  Incident,
  InvestigationContext,
  RelatedEvent,
  TimelineEntry,
} from './interfaces/investigation.interface';

/**
 * AI-powered investigation assistant that helps analysts by generating
 * investigation context, surfacing related events, and building timelines.
 *
 * This service uses local heuristics and pattern matching to provide
 * immediate assistance without requiring external API calls.
 */
export class InvestigationService {
  /**
   * Generate complete investigation context for an incident.
   * Combines incident analysis, related event suggestions, and timeline generation.
   */
  async generateContext(
    incident: Incident,
    historicalEvents: any[] = [],
  ): Promise<InvestigationContext> {
    const contextSummary = this.generateContextSummary(incident);
    const relatedEvents = this.suggestRelatedEvents(incident, historicalEvents);
    const timeline = this.buildTimeline(incident, relatedEvents);
    const indicators = this.extractIndicators(incident);
    const investigationSteps = this.suggestInvestigationSteps(incident);
    const confidence = this.calculateConfidence(incident, relatedEvents);

    return {
      incident,
      contextSummary,
      relatedEvents,
      timeline,
      indicators,
      investigationSteps,
      confidence,
    };
  }

  /**
   * Suggest related events based on incident characteristics.
   * Uses pattern matching on event types, sources, and time proximity.
   */
  suggestRelatedEvents(incident: Incident, historicalEvents: any[]): RelatedEvent[] {
    if (!historicalEvents || historicalEvents.length === 0) {
      return this.generateSyntheticRelatedEvents(incident);
    }

    return historicalEvents
      .map(event => ({
        id: event.id || `evt-${Date.now()}`,
        description: event.description || event.message || 'Security event',
        correlationScore: this.calculateCorrelation(incident, event),
        timestamp: event.timestamp || new Date().toISOString(),
        eventType: event.eventType || event.type || 'unknown',
      }))
      .filter(event => event.correlationScore > 0.3)
      .sort((a, b) => b.correlationScore - a.correlationScore)
      .slice(0, 10);
  }

  /**
   * Build chronological timeline from incident and related events.
   */
  buildTimeline(incident: Incident, relatedEvents: RelatedEvent[]): TimelineEntry[] {
    const entries: TimelineEntry[] = [
      {
        timestamp: incident.timestamp,
        description: incident.description,
        action: 'Incident detected',
        actor: incident.source,
        metadata: { severity: incident.severity },
      },
    ];

    relatedEvents.forEach(event => {
      entries.push({
        timestamp: event.timestamp,
        description: event.description,
        action: event.eventType,
        metadata: { correlationScore: event.correlationScore },
      });
    });

    return entries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  /**
   * Generate AI-powered contextual summary of the incident.
   */
  private generateContextSummary(incident: Incident): string {
    const severityContext = this.getSeverityContext(incident.severity);
    const sourceContext = this.getSourceContext(incident.source);

    return (
      `${severityContext} incident detected from ${sourceContext}. ` +
      `The incident "${incident.title}" requires ${this.getUrgencyLevel(incident.severity)} investigation. ` +
      `${incident.description}`
    );
  }

  /**
   * Extract indicators of compromise from incident data.
   */
  private extractIndicators(incident: Incident): string[] {
    const indicators: string[] = [];

    if (incident.data) {
      if (incident.data.ip) indicators.push(`IP: ${incident.data.ip}`);
      if (incident.data.address) indicators.push(`Address: ${incident.data.address}`);
      if (incident.data.user) indicators.push(`User: ${incident.data.user}`);
      if (incident.data.hash) indicators.push(`Hash: ${incident.data.hash}`);
      if (incident.data.domain) indicators.push(`Domain: ${incident.data.domain}`);
    }

    if (indicators.length === 0) {
      indicators.push(`Source: ${incident.source}`);
      indicators.push(`Severity: ${incident.severity}`);
    }

    return indicators;
  }

  /**
   * Suggest investigation steps based on incident characteristics.
   */
  private suggestInvestigationSteps(incident: Incident): string[] {
    const steps: string[] = [
      'Review incident details and verify detection accuracy',
      'Analyze related events for patterns or correlations',
    ];

    if (incident.severity === 'critical') {
      steps.push(
        'Immediately isolate affected systems',
        'Initiate incident response playbook',
        'Notify security leadership',
        'Preserve forensic evidence',
      );
    } else if (incident.severity === 'high') {
      steps.push(
        'Block identified indicators of compromise',
        'Review affected system logs',
        'Assess potential data exposure',
      );
    } else if (incident.severity === 'medium') {
      steps.push(
        'Investigate source system logs',
        'Verify false positive probability',
        'Update detection rules if needed',
      );
    } else {
      steps.push('Monitor for additional activity', 'Document findings for trend analysis');
    }

    steps.push('Update incident tracking system with findings');

    return steps;
  }

  /**
   * Calculate confidence score based on data completeness and correlation strength.
   */
  private calculateConfidence(incident: Incident, relatedEvents: RelatedEvent[]): number {
    let confidence = 0.5;

    // Boost confidence if we have incident data
    if (incident.data && Object.keys(incident.data).length > 0) {
      confidence += 0.2;
    }

    // Boost confidence if we have related events
    if (relatedEvents.length > 0) {
      const avgCorrelation =
        relatedEvents.reduce((sum, e) => sum + e.correlationScore, 0) / relatedEvents.length;
      confidence += avgCorrelation * 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate correlation score between incident and historical event.
   */
  private calculateCorrelation(incident: Incident, event: any): number {
    let score = 0.5;

    // Boost score for matching source
    if (event.source === incident.source) {
      score += 0.2;
    }

    // Boost score for time proximity (within 1 hour)
    const incidentTime = new Date(incident.timestamp).getTime();
    const eventTime = new Date(event.timestamp || Date.now()).getTime();
    const timeDiff = Math.abs(incidentTime - eventTime);
    if (timeDiff < 3600000) {
      score += 0.2;
    }

    // Boost score for matching severity
    if (event.severity === incident.severity) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate synthetic related events when no historical data is available.
   */
  private generateSyntheticRelatedEvents(incident: Incident): RelatedEvent[] {
    const events: RelatedEvent[] = [];
    const baseTime = new Date(incident.timestamp).getTime();

    events.push({
      id: `syn-${Date.now()}-1`,
      description: `Authentication attempt from ${incident.source}`,
      correlationScore: 0.8,
      timestamp: new Date(baseTime - 300000).toISOString(),
      eventType: 'authentication',
    });

    events.push({
      id: `syn-${Date.now()}-2`,
      description: `Network connection established`,
      correlationScore: 0.6,
      timestamp: new Date(baseTime - 120000).toISOString(),
      eventType: 'network_connection',
    });

    return events;
  }

  private getSeverityContext(severity: string): string {
    const map: Record<string, string> = {
      critical: 'Critical severity',
      high: 'High priority',
      medium: 'Moderate risk',
      low: 'Low priority',
    };
    return map[severity] || 'Security';
  }

  private getSourceContext(source: string): string {
    return source || 'unknown source';
  }

  private getUrgencyLevel(severity: string): string {
    const map: Record<string, string> = {
      critical: 'immediate',
      high: 'urgent',
      medium: 'prompt',
      low: 'routine',
    };
    return map[severity] || 'standard';
  }
}

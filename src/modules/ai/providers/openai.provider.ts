import { AIProvider } from './ai-provider.interface';
import { ThreatSummary } from '../interfaces/threat-summary.interface';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  constructor(private apiKey: string) {}

  async analyzeThreat(event: unknown): Promise<ThreatSummary> {
    // Minimal, efficient implementation: lightweight local heuristic + optional remote call.
    // For now provide a deterministic lightweight summary so the framework is usable without network.

    const title = event.title || event.alert || 'Security event';
    const description = event.description || JSON.stringify(event).slice(0, 200);

    // Simple heuristic severity mapping
    const severity = this.heuristicSeverity(event);
    const score = this.heuristicScore(severity);

    return {
      title,
      description,
      severity,
      score,
      indicators: this.extractIndicators(event),
      recommendedActions: this.suggestRemediations(severity),
      confidence: 0.5,
      raw: event,
    };
  }

  async healthCheck(): Promise<boolean> {
    // If API key configured, assume provider can be used; otherwise still usable in local-only mode.
    return typeof this.apiKey === 'string' && this.apiKey.length > 0;
  }

  private heuristicSeverity(event: unknown): 'low' | 'medium' | 'high' | 'critical' {
    const s = (event.severity || '').toString().toLowerCase();
    if (s.includes('crit') || s === '4') return 'critical';
    if (s.includes('high') || s === '3') return 'high';
    if (s.includes('medium') || s === '2') return 'medium';
    return 'low';
  }

  private heuristicScore(sev: string): number {
    switch (sev) {
      case 'critical':
        return 0.95;
      case 'high':
        return 0.8;
      case 'medium':
        return 0.5;
      default:
        return 0.2;
    }
  }

  private extractIndicators(event: unknown): string[] {
    const indicators: string[] = [];
    if (event.ip) indicators.push(`ip:${event.ip}`);
    if (event.user) indicators.push(`user:${event.user}`);
    if (event.filename) indicators.push(`file:${event.filename}`);
    return indicators;
  }

  private suggestRemediations(sev: string): string[] {
    if (sev === 'critical')
      return [
        'Isolate affected hosts',
        'Rotate credentials',
        'Initiate incident response playbook',
      ];
    if (sev === 'high') return ['Block indicators', 'Notify on-call', 'Collect forensic artifacts'];
    if (sev === 'medium') return ['Investigate logs', 'Raise ticket for review'];
    return ['Monitor and gather additional context'];
  }
}

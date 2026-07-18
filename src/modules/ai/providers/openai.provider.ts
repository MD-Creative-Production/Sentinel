import { AIProvider } from './ai-provider.interface';
import { ThreatSummary } from '../interfaces/threat-summary.interface';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  constructor(private apiKey: string) {}

  async analyzeThreat(event: unknown): Promise<ThreatSummary> {
    // Narrow the external event safely using lightweight guards below.
    const e = this.normalizeEvent(event);

    const title = e.title ?? e.alert ?? 'Security event';
    const description = e.description ?? safeStringify(e).slice(0, 200);

    const severity = this.heuristicSeverity(e);
    const score = this.heuristicScore(severity);

    return {
      title,
      description,
      severity,
      score,
      indicators: this.extractIndicators(e),
      recommendedActions: this.suggestRemediations(severity),
      confidence: 0.5,
      raw: event,
    };
  }

  async healthCheck(): Promise<boolean> {
    return typeof this.apiKey === 'string' && this.apiKey.length > 0;
  }

  // Lightweight event normalization: ensure we have an object with string keys.
  private normalizeEvent(event: unknown): Record<string, unknown> {
    if (event && typeof event === 'object' && !Array.isArray(event))
      return event as Record<string, unknown>;
    return { raw: event };
  }

  private heuristicSeverity(
    event: Record<string, unknown>,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const raw = event['severity'];
    const s = (typeof raw === 'string' ? raw : String(raw || '')).toLowerCase();
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

  private extractIndicators(event: Record<string, unknown>): string[] {
    const indicators: string[] = [];
    const addIfString = (k: string, prefix: string) => {
      const v = event[k];
      if (typeof v === 'string' && v.length > 0) indicators.push(`${prefix}:${v}`);
    };

    addIfString('ip', 'ip');
    addIfString('user', 'user');
    addIfString('filename', 'file');
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

// Helper: safe stringify for unknown values
function safeStringify(v: unknown): string {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v ?? '');
  } catch {
    return String(v ?? '');
  }
}

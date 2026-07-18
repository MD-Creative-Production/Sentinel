import { AIProvider } from './providers/ai-provider.interface';
import { ThreatSummary, Severity } from './interfaces/threat-summary.interface';

export class AIService {
  constructor(private providers: AIProvider[] = []) {}

  // The service accepts unknown external events; providers are responsible for
  // narrowing/validating the shape before use. This keeps the service flexible
  // while avoiding unsafe `any` usage.
  async summarize(event: unknown): Promise<ThreatSummary[]> {
    const results = await Promise.all(this.providers.map(p => p.analyzeThreat(event)));
    return results;
  }

  async bestSummary(event: unknown): Promise<ThreatSummary | null> {
    const summaries = await this.summarize(event);
    if (summaries.length === 0) return null;

    const order: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    summaries.sort(
      (a, b) => order[b.severity] - order[a.severity] || (b.score || 0) - (a.score || 0),
    );
    return summaries[0];
  }
}

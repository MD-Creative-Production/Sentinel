export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ThreatSummary {
  title: string;
  severity: Severity;
  score?: number; // 0..1
  description: string;
  indicators?: string[];
  recommendedActions?: string[];
  confidence?: number; // 0..1
  raw?: unknown;
}

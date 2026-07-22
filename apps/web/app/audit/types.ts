export type AuditActionCategory =
  | 'auth'
  | 'organization'
  | 'member'
  | 'security'
  | 'treasury'
  | 'policy'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  category: AuditActionCategory;
  severity: AuditSeverity;
  actor: AuditActor;
  target?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string; // ISO 8601
}

export interface AuditFilterState {
  categories: AuditActionCategory[];
  severities: AuditSeverity[];
  dateFrom?: string;
  dateTo?: string;
  query: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_AUDIT_FILTERS: AuditFilterState = {
  categories: [],
  severities: [],
  query: '',
};

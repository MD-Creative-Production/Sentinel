import { AuditFilterState, AuditLogResponse } from '../../app/audit/types';

const AUDIT_ENDPOINT = '/api/audit'; // adjust to your actual backend route

interface FetchAuditLogsParams {
  filters: AuditFilterState;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}

export async function fetchAuditLogs({
  filters,
  page,
  pageSize,
  signal,
}: FetchAuditLogsParams): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  if (filters.query.trim()) params.set('q', filters.query.trim());
  filters.categories.forEach(c => params.append('category', c));
  filters.severities.forEach(s => params.append('severity', s));
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);

  const res = await fetch(`${AUDIT_ENDPOINT}?${params.toString()}`, {
    signal,
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch audit logs: ${res.status}`);
  }

  return res.json() as Promise<AuditLogResponse>;
}

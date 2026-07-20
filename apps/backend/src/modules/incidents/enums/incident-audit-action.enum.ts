export enum IncidentAuditAction {
  CREATED = 'incident_created',
  UPDATED = 'incident_updated',
  STATUS_CHANGED = 'status_changed',
  OWNER_ASSIGNED = 'owner_assigned',
  OWNER_REASSIGNED = 'owner_reassigned',
  OWNER_REMOVED = 'owner_removed',
  SEVERITY_UPDATED = 'severity_updated',
  PRIORITY_UPDATED = 'priority_updated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  ARCHIVED = 'archived',
}

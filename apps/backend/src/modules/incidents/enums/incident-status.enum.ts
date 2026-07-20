export enum IncidentStatus {
  NEW = 'new',
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

/**
 * Valid forward transitions per status. Any transition not listed here
 * (including self-transitions) is rejected by IncidentStatusService.
 */
export const INCIDENT_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.NEW]: [IncidentStatus.OPEN, IncidentStatus.CLOSED],
  [IncidentStatus.OPEN]: [
    IncidentStatus.ACKNOWLEDGED,
    IncidentStatus.INVESTIGATING,
    IncidentStatus.CLOSED,
  ],
  [IncidentStatus.ACKNOWLEDGED]: [IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
  [IncidentStatus.INVESTIGATING]: [
    IncidentStatus.CONTAINED,
    IncidentStatus.RESOLVED,
    IncidentStatus.CLOSED,
  ],
  [IncidentStatus.CONTAINED]: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
  [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.REOPENED],
  [IncidentStatus.CLOSED]: [IncidentStatus.REOPENED],
  [IncidentStatus.REOPENED]: [
    IncidentStatus.OPEN,
    IncidentStatus.INVESTIGATING,
    IncidentStatus.CLOSED,
  ],
};

/**
 * Forensic Investigation & Case Management Domain Types (#126)
 */

export enum CaseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum CaseSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CaseAssigneeRole {
  INVESTIGATOR = 'INVESTIGATOR',
  LEGAL_OBSERVER = 'LEGAL_OBSERVER',
  EXTERNAL_AUDITOR = 'EXTERNAL_AUDITOR',
}

export interface CaseUserSummary {
  id: string;
  email: string;
}

export interface CaseIncidentSummary {
  id: string;
  title: string;
  severity: string;
  status: string;
}

export interface CaseAssignee {
  id: string;
  caseId: string;
  userId: string;
  role: CaseAssigneeRole;
  assignedAt: Date;
  user?: CaseUserSummary;
}

export interface CaseIncident {
  id: string;
  caseId: string;
  incidentId: string;
  linkedAt: Date;
  incident?: CaseIncidentSummary;
}

export interface CaseActivityLog {
  id: string;
  caseId: string;
  actorId: string;
  action: string;
  ipAddress?: string | null;
  changedFields?: Record<string, { from: unknown; to: unknown }> | null;
  timestamp: Date;
  actor?: CaseUserSummary;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: CaseSeverity;
  leadInvestigatorId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
  nextReviewAt?: Date | null;
  leadInvestigator?: CaseUserSummary | null;
  assignees?: CaseAssignee[];
  incidents?: CaseIncident[];
  activityLogs?: CaseActivityLog[];
}

export interface CreateCaseInput {
  caseNumber?: string;
  title: string;
  description: string;
  status?: CaseStatus;
  severity?: CaseSeverity;
  leadInvestigatorId?: string | null;
  nextReviewAt?: Date | null;
  assigneeUserIds?: Array<{ userId: string; role?: CaseAssigneeRole }>;
  incidentIds?: string[];
  actorId: string;
  ipAddress?: string;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  status?: CaseStatus;
  severity?: CaseSeverity;
  leadInvestigatorId?: string | null;
  nextReviewAt?: Date | null;
  closedAt?: Date | null;
  actorId: string;
  ipAddress?: string;
}

export interface AddCaseAssigneeInput {
  caseId: string;
  userId: string;
  role: CaseAssigneeRole;
  actorId: string;
  ipAddress?: string;
}

export interface LinkCaseIncidentInput {
  caseId: string;
  incidentId: string;
  actorId: string;
  ipAddress?: string;
}

export interface LogCaseActivityInput {
  caseId: string;
  actorId: string;
  action: string;
  ipAddress?: string | null;
  changedFields?: Record<string, { from: unknown; to: unknown }> | null;
}

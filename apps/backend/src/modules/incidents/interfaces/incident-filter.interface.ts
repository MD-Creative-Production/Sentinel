import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export interface IncidentFilter {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  priority?: IncidentPriority;
  assignedUserId?: string;
  category?: string;
  organizationId?: string;
  detectionSource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface IncidentSort {
  sortBy: 'createdAt' | 'updatedAt' | 'severity' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface IncidentPagination {
  page: number;
  limit: number;
}

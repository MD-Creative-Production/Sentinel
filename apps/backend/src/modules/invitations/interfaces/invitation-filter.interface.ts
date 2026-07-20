import { InvitationStatus } from '../enums/invitation-status.enum';
import { Role } from '../../../common/enums/role.enum';

export interface InvitationFilter {
  organizationId?: string;
  status?: InvitationStatus;
  role?: Role;
  inviteeEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface InvitationPagination {
  page: number;
  limit: number;
}

export interface InvitationSort {
  sortBy: 'createdAt' | 'updatedAt' | 'expiresAt' | 'status';
  sortOrder: 'asc' | 'desc';
}

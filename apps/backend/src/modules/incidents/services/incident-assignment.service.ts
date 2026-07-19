import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';

@Injectable()
export class IncidentAssignmentService {
  constructor(
    private readonly repository: IncidentsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async getAssignee(incidentId: string) {
    const incident = await this.repository.findById(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    return { assignedUserId: incident.assignedUserId };
  }

  async assign(
    incidentId: string,
    assignedUserId: string | null | undefined,
    actor: AuthenticatedUser,
  ) {
    const incident = await this.repository.findById(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const previousAssignee = incident.assignedUserId;
    const nextAssignee = assignedUserId ?? null;

    const action = !previousAssignee
      ? IncidentAuditAction.OWNER_ASSIGNED
      : !nextAssignee
        ? IncidentAuditAction.OWNER_REMOVED
        : IncidentAuditAction.OWNER_REASSIGNED;

    const updated = await this.repository.update(incidentId, {
      assignedUser: nextAssignee ? { connect: { id: nextAssignee } } : { disconnect: true },
    });

    await this.repository.addAuditEntry({
      incidentId,
      action,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: { assignedUserId: previousAssignee },
      newValues: { assignedUserId: nextAssignee },
    });

    if (nextAssignee) {
      await this.notifications.sendAlert({
        title: `Incident ${incidentId} assigned`,
        message: `Incident "${incident.title}" was assigned to user ${nextAssignee}`,
        severity: incident.severity as 'low' | 'medium' | 'high' | 'critical',
        metadata: { incidentId, assignedUserId: nextAssignee },
      });
    }

    return updated;
  }
}

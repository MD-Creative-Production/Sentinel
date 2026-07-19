import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { INCIDENT_STATUS_TRANSITIONS, IncidentStatus } from '../enums/incident-status.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';

@Injectable()
export class IncidentStatusService {
  constructor(
    private readonly repository: IncidentsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async transition(
    incidentId: string,
    nextStatus: IncidentStatus,
    actor: AuthenticatedUser,
    reason?: string,
  ) {
    const incident = await this.repository.findById(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const currentStatus = incident.status as IncidentStatus;
    const allowedNext = INCIDENT_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (currentStatus === nextStatus) {
      throw new BadRequestException(`Incident is already in status "${currentStatus}"`);
    }

    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition incident from "${currentStatus}" to "${nextStatus}". Allowed: ${
          allowedNext.length ? allowedNext.join(', ') : 'none (terminal)'
        }`,
      );
    }

    const now = new Date();
    const updated = await this.repository.update(incidentId, {
      status: nextStatus,
      ...(nextStatus === IncidentStatus.RESOLVED ? { resolvedAt: now } : {}),
      ...(nextStatus === IncidentStatus.CLOSED ? { closedAt: now } : {}),
      ...(nextStatus === IncidentStatus.REOPENED ? { resolvedAt: null, closedAt: null } : {}),
    });

    await this.repository.addAuditEntry({
      incidentId,
      action: this.actionForTransition(nextStatus),
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: { status: currentStatus },
      newValues: { status: nextStatus, reason },
    });

    await this.notifications.sendAlert({
      title: `Incident ${incidentId} status changed`,
      message: `Status moved from "${currentStatus}" to "${nextStatus}"${reason ? `: ${reason}` : ''}`,
      severity: incident.severity as 'low' | 'medium' | 'high' | 'critical',
      metadata: { incidentId, currentStatus, nextStatus },
    });

    return updated;
  }

  private actionForTransition(nextStatus: IncidentStatus): IncidentAuditAction {
    switch (nextStatus) {
      case IncidentStatus.RESOLVED:
        return IncidentAuditAction.RESOLVED;
      case IncidentStatus.CLOSED:
        return IncidentAuditAction.CLOSED;
      case IncidentStatus.REOPENED:
        return IncidentAuditAction.REOPENED;
      default:
        return IncidentAuditAction.STATUS_CHANGED;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { QueryIncidentsDto } from '../dto/query-incidents.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly repository: IncidentsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateIncidentDto, actor: AuthenticatedUser) {
    const incident = await this.repository.create({
      title: dto.title,
      description: dto.description,
      severity: dto.severity ?? IncidentSeverity.MEDIUM,
      priority: dto.priority ?? IncidentPriority.P3,
      category: dto.category,
      organizationId: dto.organizationId,
      detectionSource: dto.detectionSource,
      sourceAlertIds: dto.sourceAlertIds ?? [],
      tags: dto.tags ?? [],
      status: IncidentStatus.NEW,
      ...(dto.assignedUserId ? { assignedUser: { connect: { id: dto.assignedUserId } } } : {}),
    });

    await this.repository.addAuditEntry({
      incidentId: incident.id,
      action: IncidentAuditAction.CREATED,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      newValues: { ...dto },
    });

    await this.notifications.sendAlert({
      title: `New incident created: ${incident.title}`,
      message: incident.description,
      severity: incident.severity as 'low' | 'medium' | 'high' | 'critical',
      metadata: { incidentId: incident.id },
    });

    return incident;
  }

  async findAll(query: QueryIncidentsDto) {
    return this.repository.findMany(
      {
        status: query.status,
        severity: query.severity,
        priority: query.priority,
        assignedUserId: query.assignedUserId,
        category: query.category,
        organizationId: query.organizationId,
        detectionSource: query.detectionSource,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        search: query.search,
      },
      { page: query.page ?? 1, limit: query.limit ?? 20 },
      { sortBy: query.sortBy ?? 'createdAt', sortOrder: query.sortOrder ?? 'desc' },
    );
  }

  async findOne(id: string) {
    const incident = await this.repository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    const auditTrail = await this.repository.findAuditTrail(id);
    return { ...incident, auditTrail };
  }

  async update(id: string, dto: UpdateIncidentDto, actor: AuthenticatedUser) {
    const incident = await this.repository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    const updated = await this.repository.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.organizationId !== undefined ? { organizationId: dto.organizationId } : {}),
      ...(dto.detectionSource !== undefined ? { detectionSource: dto.detectionSource } : {}),
      ...(dto.sourceAlertIds !== undefined ? { sourceAlertIds: dto.sourceAlertIds } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
    });

    await this.repository.addAuditEntry({
      incidentId: id,
      action: IncidentAuditAction.UPDATED,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: this.pick(incident, Object.keys(dto)),
      newValues: { ...dto },
    });

    return updated;
  }

  async updateSeverity(id: string, severity: IncidentSeverity, actor: AuthenticatedUser) {
    const incident = await this.repository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    const updated = await this.repository.update(id, { severity });

    await this.repository.addAuditEntry({
      incidentId: id,
      action: IncidentAuditAction.SEVERITY_UPDATED,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: { severity: incident.severity },
      newValues: { severity },
    });

    return updated;
  }

  async updatePriority(id: string, priority: IncidentPriority, actor: AuthenticatedUser) {
    const incident = await this.repository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    const updated = await this.repository.update(id, { priority });

    await this.repository.addAuditEntry({
      incidentId: id,
      action: IncidentAuditAction.PRIORITY_UPDATED,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: { priority: incident.priority },
      newValues: { priority },
    });

    return updated;
  }

  async archive(id: string, actor: AuthenticatedUser) {
    const incident = await this.repository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    const updated = await this.repository.softDelete(id);

    await this.repository.addAuditEntry({
      incidentId: id,
      action: IncidentAuditAction.ARCHIVED,
      actorId: actor.userId,
      actorName: actor.name ?? actor.email,
      previousValues: { deleted: false },
      newValues: { deleted: true },
    });

    return updated;
  }

  private pick(source: Record<string, unknown>, keys: string[]) {
    return keys.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {});
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentFilter, IncidentPagination, IncidentSort } from '../interfaces';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.IncidentCreateInput) {
    return this.prisma.incident.create({ data });
  }

  findById(id: string, includeDeleted = false) {
    return this.prisma.incident.findFirst({
      where: { id, ...(includeDeleted ? {} : { deleted: false }) },
    });
  }

  async findMany(
    filter: IncidentFilter,
    pagination: IncidentPagination,
    sort: IncidentSort,
  ): Promise<PaginatedResult<Prisma.IncidentGetPayload<Record<string, never>>>> {
    const where = this.buildWhere(filter);
    const { page, limit } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  update(id: string, data: Prisma.IncidentUpdateInput) {
    return this.prisma.incident.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.incident.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  addAuditEntry(entry: {
    incidentId: string;
    action: IncidentAuditAction;
    actorId: string;
    actorName?: string;
    previousValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  }) {
    return this.prisma.incidentAuditLog.create({
      data: {
        incidentId: entry.incidentId,
        action: entry.action,
        actorId: entry.actorId,
        actorName: entry.actorName,
        previousValues: (entry.previousValues ?? undefined) as Prisma.InputJsonValue | undefined,
        newValues: (entry.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAuditTrail(incidentId: string) {
    return this.prisma.incidentAuditLog.findMany({
      where: { incidentId },
      orderBy: { timestamp: 'asc' },
    });
  }

  private buildWhere(filter: IncidentFilter): Prisma.IncidentWhereInput {
    const where: Prisma.IncidentWhereInput = { deleted: false };

    if (filter.status) where.status = filter.status;
    if (filter.severity) where.severity = filter.severity;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assignedUserId) where.assignedUserId = filter.assignedUserId;
    if (filter.category) where.category = filter.category;
    if (filter.organizationId) where.organizationId = filter.organizationId;
    if (filter.detectionSource) where.detectionSource = filter.detectionSource;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    if (filter.search) {
      const term = filter.search;
      where.OR = [
        { id: { equals: term } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { assignedUserId: { equals: term } },
        { sourceAlertIds: { has: term } },
        { detectionSource: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ];
    }

    return where;
  }
}

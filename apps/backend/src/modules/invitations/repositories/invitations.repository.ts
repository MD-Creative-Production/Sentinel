import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { InvitationAuditAction } from '../enums/invitation-audit-action.enum';
import { InvitationFilter, InvitationPagination, InvitationSort } from '../interfaces';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InvitationCreateInput) {
    return this.prisma.invitation.create({ data });
  }

  findById(id: string) {
    return this.prisma.invitation.findUnique({ where: { id } });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.invitation.findUnique({ where: { tokenHash } });
  }

  findPendingByOrgAndEmail(organizationId: string, inviteeEmail: string) {
    return this.prisma.invitation.findFirst({
      where: { organizationId, inviteeEmail, status: 'pending' },
    });
  }

  async findMany(
    filter: InvitationFilter,
    pagination: InvitationPagination,
    sort: InvitationSort,
  ): Promise<PaginatedResult<Prisma.InvitationGetPayload<Record<string, never>>>> {
    const where = this.buildWhere(filter);
    const { page, limit } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invitation.count({ where }),
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

  update(id: string, data: Prisma.InvitationUpdateInput) {
    return this.prisma.invitation.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.invitation.delete({ where: { id } });
  }

  addAuditEntry(entry: {
    invitationId: string;
    action: InvitationAuditAction;
    actorId?: string | null;
    actorEmail?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    return this.prisma.invitationAuditLog.create({
      data: {
        invitationId: entry.invitationId,
        action: entry.action,
        actorId: entry.actorId ?? undefined,
        actorEmail: entry.actorEmail ?? undefined,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAuditTrail(invitationId: string) {
    return this.prisma.invitationAuditLog.findMany({
      where: { invitationId },
      orderBy: { timestamp: 'asc' },
    });
  }

  private buildWhere(filter: InvitationFilter): Prisma.InvitationWhereInput {
    const where: Prisma.InvitationWhereInput = {};

    if (filter.organizationId) where.organizationId = filter.organizationId;
    if (filter.status) where.status = filter.status;
    if (filter.role) where.role = filter.role;
    if (filter.inviteeEmail) where.inviteeEmail = filter.inviteeEmail;

    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    return where;
  }
}

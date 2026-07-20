import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { QueryInvitationsDto } from '../dto/query-invitations.dto';
import { InvitationAuditAction } from '../enums/invitation-audit-action.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { InvitationDeliveryPayload } from '../entities/invitation.entity';
import { InvitationsRepository } from '../repositories/invitations.repository';
import { InvitationTokenService } from './invitation-token.service';

const DEFAULT_EXPIRATION_DAYS = 7;

type InvitationRecord = Prisma.InvitationGetPayload<Record<string, never>>;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly repository: InvitationsRepository,
    private readonly tokenService: InvitationTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateInvitationDto, actor: AuthenticatedUser) {
    const existing = await this.repository.findPendingByOrgAndEmail(
      dto.organizationId,
      dto.inviteeEmail,
    );
    if (existing && !this.isExpired(existing)) {
      throw new ConflictException(
        `A pending invitation already exists for "${dto.inviteeEmail}" in this organization`,
      );
    }

    const rawToken = this.tokenService.generate();
    const expiresAt = this.computeExpiresAt();

    const invitation = await this.repository.create({
      organization: { connect: { id: dto.organizationId } },
      inviteeEmail: dto.inviteeEmail,
      role: dto.role,
      status: InvitationStatus.PENDING,
      tokenHash: this.tokenService.hash(rawToken),
      expiresAt,
      invitedBy: { connect: { id: actor.userId } },
    });

    await this.repository.addAuditEntry({
      invitationId: invitation.id,
      action: InvitationAuditAction.CREATED,
      actorId: actor.userId,
      actorEmail: actor.email,
      metadata: { inviteeEmail: dto.inviteeEmail, role: dto.role },
    });

    const delivery = await this.buildDeliveryPayload(invitation, rawToken, actor);

    return { invitation, token: rawToken, delivery };
  }

  async findAll(query: QueryInvitationsDto) {
    const result = await this.repository.findMany(
      {
        organizationId: query.organizationId,
        status: query.status,
        role: query.role,
        inviteeEmail: query.inviteeEmail,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      },
      { page: query.page ?? 1, limit: query.limit ?? 20 },
      { sortBy: query.sortBy ?? 'createdAt', sortOrder: query.sortOrder ?? 'desc' },
    );

    const items = await Promise.all(result.items.map(item => this.deriveEffectiveStatus(item)));
    return { ...result, items };
  }

  async findOne(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException(`Invitation "${id}" not found`);
    }

    const effective = await this.deriveEffectiveStatus(invitation);
    const auditTrail = await this.repository.findAuditTrail(id);
    return { ...effective, auditTrail };
  }

  async resend(id: string, actor: AuthenticatedUser, reason?: string) {
    await this.getPendingOrThrow(id);

    const rawToken = this.tokenService.generate();
    const expiresAt = this.computeExpiresAt();

    const updated = await this.repository.update(id, {
      tokenHash: this.tokenService.hash(rawToken),
      expiresAt,
    });

    await this.repository.addAuditEntry({
      invitationId: id,
      action: InvitationAuditAction.RESENT,
      actorId: actor.userId,
      actorEmail: actor.email,
      metadata: reason ? { reason } : undefined,
    });

    const delivery = await this.buildDeliveryPayload(updated, rawToken, actor);

    return { invitation: updated, token: rawToken, delivery };
  }

  async revoke(id: string, actor: AuthenticatedUser) {
    await this.getPendingOrThrow(id);

    const updated = await this.repository.update(id, {
      status: InvitationStatus.REVOKED,
      revokedAt: new Date(),
    });

    await this.repository.addAuditEntry({
      invitationId: id,
      action: InvitationAuditAction.REVOKED,
      actorId: actor.userId,
      actorEmail: actor.email,
    });

    return updated;
  }

  async remove(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException(`Invitation "${id}" not found`);
    }
    await this.repository.delete(id);
  }

  /**
   * A `pending` invitation past its TTL is treated as expired without a background
   * job. This persists the transition (and logs it) the first time a stale row is
   * touched, so status is never stale by more than one read/write cycle.
   */
  async deriveEffectiveStatus(invitation: InvitationRecord): Promise<InvitationRecord> {
    if (invitation.status !== InvitationStatus.PENDING || !this.isExpired(invitation)) {
      return invitation;
    }

    const updated = await this.repository.update(invitation.id, {
      status: InvitationStatus.EXPIRED,
    });

    await this.repository.addAuditEntry({
      invitationId: invitation.id,
      action: InvitationAuditAction.EXPIRED,
      actorId: null,
    });

    return updated;
  }

  private async getPendingOrThrow(id: string): Promise<InvitationRecord> {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new NotFoundException(`Invitation "${id}" not found`);
    }

    const effective = await this.deriveEffectiveStatus(invitation);
    if (effective.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is "${effective.status}" and can no longer be modified`,
      );
    }

    return effective;
  }

  private async buildDeliveryPayload(
    invitation: InvitationRecord,
    rawToken: string,
    actor: AuthenticatedUser,
  ): Promise<InvitationDeliveryPayload> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: invitation.organizationId },
    });
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    return {
      organizationName: organization?.name ?? invitation.organizationId,
      inviterName: actor.name ?? actor.email ?? actor.userId,
      role: invitation.role as InvitationDeliveryPayload['role'],
      invitationLink: `${frontendUrl}/invitations/accept?token=${rawToken}`,
      expiresAt: invitation.expiresAt,
    };
  }

  private isExpired(invitation: { expiresAt: Date }): boolean {
    return invitation.expiresAt.getTime() < Date.now();
  }

  private computeExpiresAt(): Date {
    const days = parseInt(process.env.INVITATION_EXPIRATION_DAYS ?? '', 10);
    const ttlDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_EXPIRATION_DAYS;
    return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }
}

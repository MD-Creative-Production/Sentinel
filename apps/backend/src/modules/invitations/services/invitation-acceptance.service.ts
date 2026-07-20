import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { InvitationAuditAction } from '../enums/invitation-audit-action.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { InvitationsRepository } from '../repositories/invitations.repository';
import { InvitationTokenService } from './invitation-token.service';
import { InvitationsService } from './invitations.service';

@Injectable()
export class InvitationAcceptanceService {
  constructor(
    private readonly repository: InvitationsRepository,
    private readonly tokenService: InvitationTokenService,
    private readonly invitationsService: InvitationsService,
    private readonly prisma: PrismaService,
  ) {}

  async accept(dto: AcceptInvitationDto) {
    const tokenHash = this.tokenService.hash(dto.token);
    const invitation = await this.repository.findByTokenHash(tokenHash);

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    const effective = await this.invitationsService.deriveEffectiveStatus(invitation);

    if (effective.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }
    if (effective.status === InvitationStatus.REVOKED) {
      throw new BadRequestException('This invitation has been revoked');
    }
    if (effective.status === InvitationStatus.EXPIRED) {
      throw new BadRequestException('This invitation has expired');
    }

    if (effective.inviteeEmail.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invited address');
    }

    const user = await this.findOrCreateUser(dto.email);

    await this.prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: effective.organizationId,
          userId: user.id,
        },
      },
      update: { role: effective.role },
      create: {
        organizationId: effective.organizationId,
        userId: user.id,
        role: effective.role,
      },
    });

    const updated = await this.repository.update(effective.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    await this.repository.addAuditEntry({
      invitationId: effective.id,
      action: InvitationAuditAction.ACCEPTED,
      actorId: user.id,
      actorEmail: user.email,
    });

    return { invitation: updated, user };
  }

  private async findOrCreateUser(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return existing;
    }
    return this.prisma.user.create({ data: { email } });
  }
}

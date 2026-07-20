import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { InvitationsRepository } from '../repositories/invitations.repository';

/**
 * Requires the caller to hold an ADMIN Membership in the target organization.
 * Resolves the organization either directly (body/query.organizationId, for
 * create/list) or indirectly via the invitation referenced by :id (for
 * resend/revoke/delete), since those routes don't carry organizationId themselves.
 */
@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationsRepository: InvitationsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const organizationId = await this.resolveOrganizationId(request);
    if (!organizationId) {
      throw new ForbiddenException('organizationId is required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.userId } },
    });

    if (!membership || membership.role !== Role.ADMIN) {
      throw new ForbiddenException('Only organization admins can manage invitations');
    }

    return true;
  }

  private async resolveOrganizationId(request: {
    body?: { organizationId?: string };
    query?: { organizationId?: string };
    params?: { id?: string };
  }): Promise<string | undefined> {
    if (request.body?.organizationId) {
      return request.body.organizationId;
    }
    if (request.query?.organizationId) {
      return request.query.organizationId;
    }
    if (request.params?.id) {
      const invitation = await this.invitationsRepository.findById(request.params.id);
      return invitation?.organizationId;
    }
    return undefined;
  }
}

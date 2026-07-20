import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { InvitationsService } from '../services/invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  const actor: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin One',
    roles: [Role.ADMIN],
  };

  const repository = {
    findPendingByOrgAndEmail: jest.fn(),
    create: jest.fn(),
    addAuditEntry: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findAuditTrail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const tokenService = {
    generate: jest.fn(),
    hash: jest.fn(),
  };
  const prisma = {
    organization: { findUnique: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitationsService(repository as any, tokenService as any, prisma as any);
    tokenService.generate.mockReturnValue('raw-token');
    tokenService.hash.mockReturnValue('hashed-token');
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Acme Inc' });
  });

  describe('create', () => {
    it('creates an invitation and returns the raw token plus a delivery payload', async () => {
      repository.findPendingByOrgAndEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        id: 'inv-1',
        organizationId: 'org-1',
        inviteeEmail: 'new@example.com',
        role: Role.ANALYST,
        expiresAt: new Date(Date.now() + 1000),
      });

      const result = await service.create(
        { organizationId: 'org-1', inviteeEmail: 'new@example.com', role: Role.ANALYST },
        actor,
      );

      expect(result.token).toEqual('raw-token');
      expect(result.delivery.organizationName).toEqual('Acme Inc');
      expect(result.delivery.invitationLink).toContain('raw-token');
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ invitationId: 'inv-1', action: 'invitation_created' }),
      );
    });

    it('rejects a duplicate pending invitation for the same org+email', async () => {
      repository.findPendingByOrgAndEmail.mockResolvedValue({
        id: 'inv-existing',
        expiresAt: new Date(Date.now() + 1000 * 60),
      });

      await expect(
        service.create(
          { organizationId: 'org-1', inviteeEmail: 'new@example.com', role: Role.ANALYST },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('allows re-inviting once the existing pending invitation has expired', async () => {
      repository.findPendingByOrgAndEmail.mockResolvedValue({
        id: 'inv-existing',
        expiresAt: new Date(Date.now() - 1000),
      });
      repository.create.mockResolvedValue({
        id: 'inv-2',
        organizationId: 'org-1',
        inviteeEmail: 'new@example.com',
        role: Role.ANALYST,
        expiresAt: new Date(Date.now() + 1000),
      });

      await expect(
        service.create(
          { organizationId: 'org-1', inviteeEmail: 'new@example.com', role: Role.ANALYST },
          actor,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the invitation does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('flips a stale pending invitation to expired on read', async () => {
      const staleInvitation = {
        id: 'inv-1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
      };
      repository.findById.mockResolvedValue(staleInvitation);
      repository.update.mockResolvedValue({ ...staleInvitation, status: InvitationStatus.EXPIRED });
      repository.findAuditTrail.mockResolvedValue([]);

      const result = await service.findOne('inv-1');

      expect(result.status).toEqual(InvitationStatus.EXPIRED);
      expect(repository.update).toHaveBeenCalledWith('inv-1', { status: InvitationStatus.EXPIRED });
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invitation_expired', actorId: null }),
      );
    });

    it('leaves a non-expired pending invitation untouched', async () => {
      const invitation = {
        id: 'inv-1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 1000 * 60),
      };
      repository.findById.mockResolvedValue(invitation);
      repository.findAuditTrail.mockResolvedValue([]);

      const result = await service.findOne('inv-1');

      expect(result.status).toEqual(InvitationStatus.PENDING);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('revokes a pending invitation', async () => {
      const invitation = {
        id: 'inv-1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 1000 * 60),
      };
      repository.findById.mockResolvedValue(invitation);
      repository.update.mockResolvedValue({ ...invitation, status: InvitationStatus.REVOKED });

      const result = await service.revoke('inv-1', actor);

      expect(result.status).toEqual(InvitationStatus.REVOKED);
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invitation_revoked' }),
      );
    });

    it('rejects revoking an already-accepted invitation', async () => {
      repository.findById.mockResolvedValue({
        id: 'inv-1',
        status: InvitationStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 1000 * 60),
      });

      await expect(service.revoke('inv-1', actor)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resend', () => {
    it('rotates the token and expiry for a pending invitation', async () => {
      const invitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        status: InvitationStatus.PENDING,
        role: Role.ANALYST,
        expiresAt: new Date(Date.now() + 1000 * 60),
      };
      repository.findById.mockResolvedValue(invitation);
      repository.update.mockResolvedValue({ ...invitation, tokenHash: 'hashed-token' });

      const result = await service.resend('inv-1', actor);

      expect(result.token).toEqual('raw-token');
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invitation_resent' }),
      );
    });
  });
});

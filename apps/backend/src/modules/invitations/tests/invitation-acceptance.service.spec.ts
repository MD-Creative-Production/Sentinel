import { BadRequestException } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';
import { InvitationAcceptanceService } from '../services/invitation-acceptance.service';

describe('InvitationAcceptanceService', () => {
  let service: InvitationAcceptanceService;

  const repository = {
    findByTokenHash: jest.fn(),
    update: jest.fn(),
    addAuditEntry: jest.fn(),
  };
  const tokenService = {
    hash: jest.fn().mockReturnValue('hashed-token'),
  };
  const invitationsService = {
    deriveEffectiveStatus: jest.fn(),
  };
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    membership: { upsert: jest.fn() },
  };

  const pendingInvitation = {
    id: 'inv-1',
    organizationId: 'org-1',
    inviteeEmail: 'new@example.com',
    role: Role.ANALYST,
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 1000 * 60),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitationAcceptanceService(
      repository as any,
      tokenService as any,
      invitationsService as any,
      prisma as any,
    );
    repository.findByTokenHash.mockResolvedValue(pendingInvitation);
    invitationsService.deriveEffectiveStatus.mockResolvedValue(pendingInvitation);
    repository.update.mockResolvedValue({
      ...pendingInvitation,
      status: InvitationStatus.ACCEPTED,
    });
  });

  it('rejects an unknown token', async () => {
    repository.findByTokenHash.mockResolvedValue(null);
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the email does not match the invitee', async () => {
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'someone-else@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an already-accepted invitation', async () => {
    invitationsService.deriveEffectiveStatus.mockResolvedValue({
      ...pendingInvitation,
      status: InvitationStatus.ACCEPTED,
    });
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a revoked invitation', async () => {
    invitationsService.deriveEffectiveStatus.mockResolvedValue({
      ...pendingInvitation,
      status: InvitationStatus.REVOKED,
    });
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired invitation', async () => {
    invitationsService.deriveEffectiveStatus.mockResolvedValue({
      ...pendingInvitation,
      status: InvitationStatus.EXPIRED,
    });
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a new user when none exists for the invitee email, then creates the membership', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'user-new', email: 'new@example.com' });

    const result = await service.accept({ token: 'a'.repeat(64), email: 'new@example.com' });

    expect(prisma.user.create).toHaveBeenCalledWith({ data: { email: 'new@example.com' } });
    expect(prisma.membership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId_userId: { organizationId: 'org-1', userId: 'user-new' } },
        create: { organizationId: 'org-1', userId: 'user-new', role: Role.ANALYST },
      }),
    );
    expect(result.invitation.status).toEqual(InvitationStatus.ACCEPTED);
  });

  it('reuses an existing user account matching the invitee email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-existing', email: 'new@example.com' });

    await service.accept({ token: 'a'.repeat(64), email: 'new@example.com' });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.membership.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId_userId: { organizationId: 'org-1', userId: 'user-existing' } },
      }),
    );
  });

  it('matches the invitee email case-insensitively', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-existing', email: 'new@example.com' });
    await expect(
      service.accept({ token: 'a'.repeat(64), email: 'NEW@EXAMPLE.COM' }),
    ).resolves.toBeDefined();
  });
});

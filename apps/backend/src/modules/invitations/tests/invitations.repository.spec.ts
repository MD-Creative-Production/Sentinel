import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { InvitationAuditAction } from '../enums/invitation-audit-action.enum';
import { InvitationsRepository } from '../repositories/invitations.repository';

describe('InvitationsRepository', () => {
  let repository: InvitationsRepository;
  const mockPrisma = {
    invitation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invitationAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationsRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get(InvitationsRepository);
  });

  it('creates an invitation via prisma', async () => {
    mockPrisma.invitation.create.mockResolvedValue({ id: 'inv-1' });
    const result = await repository.create({ inviteeEmail: 'a@example.com' } as any);
    expect(mockPrisma.invitation.create).toHaveBeenCalledWith({
      data: { inviteeEmail: 'a@example.com' },
    });
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('finds a pending invitation for the same org+email', async () => {
    mockPrisma.invitation.findFirst.mockResolvedValue(null);
    await repository.findPendingByOrgAndEmail('org-1', 'a@example.com');
    expect(mockPrisma.invitation.findFirst).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', inviteeEmail: 'a@example.com', status: 'pending' },
    });
  });

  it('finds an invitation by token hash', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue(null);
    await repository.findByTokenHash('hash-1');
    expect(mockPrisma.invitation.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash-1' },
    });
  });

  it('builds pagination metadata from total count', async () => {
    mockPrisma.invitation.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    mockPrisma.invitation.count.mockResolvedValue(45);

    const result = await repository.findMany(
      { organizationId: 'org-1' },
      { page: 2, limit: 20 },
      { sortBy: 'createdAt', sortOrder: 'desc' },
    );

    expect(result.meta).toEqual({ total: 45, page: 2, limit: 20, totalPages: 3 });
    expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      orderBy: { createdAt: 'desc' },
      skip: 20,
      take: 20,
    });
  });

  it('writes an audit entry', async () => {
    mockPrisma.invitationAuditLog.create.mockResolvedValue({ id: 'log-1' });
    await repository.addAuditEntry({
      invitationId: 'inv-1',
      action: InvitationAuditAction.CREATED,
      actorId: 'user-1',
      actorEmail: 'admin@example.com',
    });
    expect(mockPrisma.invitationAuditLog.create).toHaveBeenCalledWith({
      data: {
        invitationId: 'inv-1',
        action: InvitationAuditAction.CREATED,
        actorId: 'user-1',
        actorEmail: 'admin@example.com',
        metadata: undefined,
      },
    });
  });

  it('records a null actorId for system-driven audit entries', async () => {
    mockPrisma.invitationAuditLog.create.mockResolvedValue({ id: 'log-1' });
    await repository.addAuditEntry({
      invitationId: 'inv-1',
      action: InvitationAuditAction.EXPIRED,
      actorId: null,
    });
    expect(mockPrisma.invitationAuditLog.create).toHaveBeenCalledWith({
      data: {
        invitationId: 'inv-1',
        action: InvitationAuditAction.EXPIRED,
        actorId: undefined,
        actorEmail: undefined,
        metadata: undefined,
      },
    });
  });
});

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { OrgAdminGuard } from '../guards/org-admin.guard';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('OrgAdminGuard', () => {
  const prisma = { membership: { findUnique: jest.fn() } };
  const invitationsRepository = { findById: jest.fn() };
  let guard: OrgAdminGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new OrgAdminGuard(prisma as any, invitationsRepository as any);
  });

  it('throws when there is no authenticated user', async () => {
    await expect(guard.canActivate(contextFor({ body: {} }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('resolves organizationId from the request body and allows an org admin', async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const request = { user: { userId: 'u1' }, body: { organizationId: 'org-1' } };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: 'org-1', userId: 'u1' } },
    });
  });

  it('resolves organizationId from the query string', async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const request = { user: { userId: 'u1' }, query: { organizationId: 'org-2' } };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
  });

  it('resolves organizationId by looking up the invitation from :id', async () => {
    invitationsRepository.findById.mockResolvedValue({ organizationId: 'org-3' });
    prisma.membership.findUnique.mockResolvedValue({ role: Role.ADMIN });
    const request = { user: { userId: 'u1' }, params: { id: 'inv-1' } };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(invitationsRepository.findById).toHaveBeenCalledWith('inv-1');
  });

  it('rejects a non-admin member', async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: Role.VIEWER });
    const request = { user: { userId: 'u1' }, body: { organizationId: 'org-1' } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a user with no membership in the organization', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);
    const request = { user: { userId: 'u1' }, body: { organizationId: 'org-1' } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when no organizationId can be resolved at all', async () => {
    const request = { user: { userId: 'u1' }, body: {} };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
  });
});

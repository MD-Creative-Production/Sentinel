import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InvitationsController } from '../controllers/invitations.controller';
import { OrgAdminGuard } from '../guards/org-admin.guard';
import { InvitationAcceptanceService } from '../services/invitation-acceptance.service';
import { InvitationsService } from '../services/invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;

  const invitationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    resend: jest.fn(),
    revoke: jest.fn(),
    remove: jest.fn(),
  };
  const acceptanceService = { accept: jest.fn() };
  const actor: AuthenticatedUser = { userId: 'admin-1', roles: [] as any };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: invitationsService },
        { provide: InvitationAcceptanceService, useValue: acceptanceService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(InvitationsController);
  });

  it('delegates create to InvitationsService', async () => {
    invitationsService.create.mockResolvedValue({ invitation: { id: 'inv-1' } });
    const dto = { organizationId: 'org-1', inviteeEmail: 'a@example.com', role: 'analyst' } as any;
    const result = await controller.create(dto, actor);
    expect(invitationsService.create).toHaveBeenCalledWith(dto, actor);
    expect(result).toEqual({ invitation: { id: 'inv-1' } });
  });

  it('delegates findAll to InvitationsService', async () => {
    invitationsService.findAll.mockResolvedValue({ items: [], meta: {} });
    const query = { organizationId: 'org-1' } as any;
    await controller.findAll(query);
    expect(invitationsService.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates findOne to InvitationsService', async () => {
    invitationsService.findOne.mockResolvedValue({ id: 'inv-1' });
    await controller.findOne('inv-1');
    expect(invitationsService.findOne).toHaveBeenCalledWith('inv-1');
  });

  it('delegates accept to InvitationAcceptanceService', async () => {
    acceptanceService.accept.mockResolvedValue({ invitation: { id: 'inv-1' } });
    const dto = { token: 'a'.repeat(64), email: 'a@example.com' };
    await controller.accept(dto);
    expect(acceptanceService.accept).toHaveBeenCalledWith(dto);
  });

  it('delegates resend to InvitationsService with the reason', async () => {
    invitationsService.resend.mockResolvedValue({ token: 'raw' });
    await controller.resend('inv-1', { reason: 'lost the email' }, actor);
    expect(invitationsService.resend).toHaveBeenCalledWith('inv-1', actor, 'lost the email');
  });

  it('delegates revoke to InvitationsService', async () => {
    invitationsService.revoke.mockResolvedValue({ id: 'inv-1', status: 'revoked' });
    await controller.revoke('inv-1', actor);
    expect(invitationsService.revoke).toHaveBeenCalledWith('inv-1', actor);
  });

  it('delegates remove to InvitationsService', async () => {
    invitationsService.remove.mockResolvedValue(undefined);
    await controller.remove('inv-1');
    expect(invitationsService.remove).toHaveBeenCalledWith('inv-1');
  });
});

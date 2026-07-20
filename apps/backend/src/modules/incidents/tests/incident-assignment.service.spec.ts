import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';
import { IncidentAssignmentService } from '../services/incident-assignment.service';

describe('IncidentAssignmentService', () => {
  let service: IncidentAssignmentService;
  const repository = {
    findById: jest.fn(),
    update: jest.fn(),
    addAuditEntry: jest.fn(),
  };
  const notifications = { sendAlert: jest.fn() };
  const actor: AuthenticatedUser = { userId: 'user-1', name: 'Alice', roles: [] as any };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentAssignmentService,
        { provide: IncidentsRepository, useValue: repository },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(IncidentAssignmentService);
  });

  it('throws NotFoundException for a missing incident', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.assign('missing', 'user-2', actor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assigns an unassigned incident and notifies', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      title: 'Wallet drain',
      assignedUserId: null,
      severity: 'high',
    });
    repository.update.mockResolvedValue({ id: 'inc-1', assignedUserId: 'user-2' });

    await service.assign('inc-1', 'user-2', actor);

    expect(repository.update).toHaveBeenCalledWith('inc-1', {
      assignedUser: { connect: { id: 'user-2' } },
    });
    expect(repository.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: IncidentAuditAction.OWNER_ASSIGNED }),
    );
    expect(notifications.sendAlert).toHaveBeenCalled();
  });

  it('reassigns an already-assigned incident', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      title: 'Wallet drain',
      assignedUserId: 'user-2',
      severity: 'high',
    });
    repository.update.mockResolvedValue({});

    await service.assign('inc-1', 'user-3', actor);

    expect(repository.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: IncidentAuditAction.OWNER_REASSIGNED }),
    );
  });

  it('removes the assignee when assignedUserId is null', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      title: 'Wallet drain',
      assignedUserId: 'user-2',
      severity: 'high',
    });
    repository.update.mockResolvedValue({});

    await service.assign('inc-1', null, actor);

    expect(repository.update).toHaveBeenCalledWith('inc-1', {
      assignedUser: { disconnect: true },
    });
    expect(repository.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: IncidentAuditAction.OWNER_REMOVED }),
    );
    expect(notifications.sendAlert).not.toHaveBeenCalled();
  });
});

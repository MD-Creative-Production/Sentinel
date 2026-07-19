import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';
import { IncidentStatusService } from '../services/incident-status.service';

describe('IncidentStatusService', () => {
  let service: IncidentStatusService;
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
        IncidentStatusService,
        { provide: IncidentsRepository, useValue: repository },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(IncidentStatusService);
  });

  it('throws NotFoundException for a missing incident', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.transition('missing', IncidentStatus.OPEN, actor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects an invalid transition', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      status: IncidentStatus.NEW,
      severity: 'medium',
    });
    await expect(
      service.transition('inc-1', IncidentStatus.RESOLVED, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects a self-transition', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      status: IncidentStatus.OPEN,
      severity: 'medium',
    });
    await expect(service.transition('inc-1', IncidentStatus.OPEN, actor)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows a valid transition, records audit entry and notifies', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      status: IncidentStatus.NEW,
      severity: 'high',
    });
    repository.update.mockResolvedValue({ id: 'inc-1', status: IncidentStatus.OPEN });

    const result = await service.transition('inc-1', IncidentStatus.OPEN, actor, 'triage started');

    expect(repository.update).toHaveBeenCalledWith('inc-1', { status: IncidentStatus.OPEN });
    expect(repository.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentId: 'inc-1',
        actorId: 'user-1',
        previousValues: { status: IncidentStatus.NEW },
        newValues: { status: IncidentStatus.OPEN, reason: 'triage started' },
      }),
    );
    expect(notifications.sendAlert).toHaveBeenCalled();
    expect(result).toEqual({ id: 'inc-1', status: IncidentStatus.OPEN });
  });

  it('stamps resolvedAt when transitioning to resolved', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      status: IncidentStatus.INVESTIGATING,
      severity: 'medium',
    });
    repository.update.mockResolvedValue({});

    await service.transition('inc-1', IncidentStatus.RESOLVED, actor);

    expect(repository.update).toHaveBeenCalledWith('inc-1', {
      status: IncidentStatus.RESOLVED,
      resolvedAt: expect.any(Date),
    });
  });

  it('clears resolvedAt/closedAt when reopened', async () => {
    repository.findById.mockResolvedValue({
      id: 'inc-1',
      status: IncidentStatus.CLOSED,
      severity: 'medium',
    });
    repository.update.mockResolvedValue({});

    await service.transition('inc-1', IncidentStatus.REOPENED, actor);

    expect(repository.update).toHaveBeenCalledWith('inc-1', {
      status: IncidentStatus.REOPENED,
      resolvedAt: null,
      closedAt: null,
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';
import { IncidentsService } from '../services/incidents.service';

describe('IncidentsService', () => {
  let service: IncidentsService;
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    addAuditEntry: jest.fn(),
    findAuditTrail: jest.fn(),
  };
  const notifications = { sendAlert: jest.fn() };
  const actor: AuthenticatedUser = { userId: 'user-1', name: 'Alice', roles: [] as any };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: IncidentsRepository, useValue: repository },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(IncidentsService);
  });

  describe('create', () => {
    it('creates an incident with defaults, audits it, and notifies', async () => {
      repository.create.mockResolvedValue({
        id: 'inc-1',
        title: 'Test',
        description: 'desc',
        severity: IncidentSeverity.MEDIUM,
      });

      const result = await service.create({ title: 'Test', description: 'desc' } as any, actor);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          severity: IncidentSeverity.MEDIUM,
          priority: IncidentPriority.P3,
          status: IncidentStatus.NEW,
        }),
      );
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: IncidentAuditAction.CREATED, incidentId: 'inc-1' }),
      );
      expect(notifications.sendAlert).toHaveBeenCalled();
      expect(result.id).toBe('inc-1');
    });

    it('connects the assignee when assignedUserId is provided', async () => {
      repository.create.mockResolvedValue({ id: 'inc-1', severity: 'low' });
      await service.create(
        { title: 'T', description: 'd', assignedUserId: 'user-9' } as any,
        actor,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ assignedUser: { connect: { id: 'user-9' } } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when incident does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the incident with its audit trail attached', async () => {
      repository.findById.mockResolvedValue({ id: 'inc-1', title: 'T' });
      repository.findAuditTrail.mockResolvedValue([{ id: 'audit-1' }]);

      const result = await service.findOne('inc-1');

      expect(result).toEqual({ id: 'inc-1', title: 'T', auditTrail: [{ id: 'audit-1' }] });
    });
  });

  describe('findAll', () => {
    it('delegates filtering/pagination/sorting to the repository', async () => {
      repository.findMany.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      });

      await service.findAll({
        status: IncidentStatus.OPEN,
        page: 2,
        limit: 10,
        sortBy: 'severity',
        sortOrder: 'asc',
      } as any);

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: IncidentStatus.OPEN }),
        { page: 2, limit: 10 },
        { sortBy: 'severity', sortOrder: 'asc' },
      );
    });
  });

  describe('updateSeverity / updatePriority', () => {
    it('updates severity and writes an audit entry', async () => {
      repository.findById.mockResolvedValue({ id: 'inc-1', severity: IncidentSeverity.LOW });
      repository.update.mockResolvedValue({ id: 'inc-1', severity: IncidentSeverity.CRITICAL });

      await service.updateSeverity('inc-1', IncidentSeverity.CRITICAL, actor);

      expect(repository.update).toHaveBeenCalledWith('inc-1', {
        severity: IncidentSeverity.CRITICAL,
      });
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: IncidentAuditAction.SEVERITY_UPDATED }),
      );
    });

    it('updates priority and writes an audit entry', async () => {
      repository.findById.mockResolvedValue({ id: 'inc-1', priority: IncidentPriority.P4 });
      repository.update.mockResolvedValue({ id: 'inc-1', priority: IncidentPriority.P1 });

      await service.updatePriority('inc-1', IncidentPriority.P1, actor);

      expect(repository.update).toHaveBeenCalledWith('inc-1', { priority: IncidentPriority.P1 });
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: IncidentAuditAction.PRIORITY_UPDATED }),
      );
    });

    it('throws NotFoundException for a missing incident on severity update', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.updateSeverity('missing', IncidentSeverity.HIGH, actor),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('archive', () => {
    it('soft-deletes the incident and writes an audit entry', async () => {
      repository.findById.mockResolvedValue({ id: 'inc-1' });
      repository.softDelete.mockResolvedValue({ id: 'inc-1', deleted: true });

      await service.archive('inc-1', actor);

      expect(repository.softDelete).toHaveBeenCalledWith('inc-1');
      expect(repository.addAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: IncidentAuditAction.ARCHIVED }),
      );
    });

    it('throws NotFoundException when archiving a missing incident', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.archive('missing', actor)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

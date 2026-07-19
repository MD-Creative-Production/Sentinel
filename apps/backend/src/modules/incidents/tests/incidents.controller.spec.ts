import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { IncidentsController } from '../controllers/incidents.controller';
import { IncidentAssignmentService } from '../services/incident-assignment.service';
import { IncidentStatusService } from '../services/incident-status.service';
import { IncidentsService } from '../services/incidents.service';

describe('IncidentsController', () => {
  let controller: IncidentsController;

  const incidentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateSeverity: jest.fn(),
    updatePriority: jest.fn(),
    archive: jest.fn(),
  };
  const statusService = { transition: jest.fn() };
  const assignmentService = { assign: jest.fn() };
  const actor: AuthenticatedUser = { userId: 'user-1', roles: [] as any };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: incidentsService },
        { provide: IncidentStatusService, useValue: statusService },
        { provide: IncidentAssignmentService, useValue: assignmentService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(IncidentsController);
  });

  it('delegates create to IncidentsService', async () => {
    incidentsService.create.mockResolvedValue({ id: 'inc-1' });
    const dto = { title: 'T', description: 'd' } as any;
    const result = await controller.create(dto, actor);
    expect(incidentsService.create).toHaveBeenCalledWith(dto, actor);
    expect(result).toEqual({ id: 'inc-1' });
  });

  it('delegates listing to IncidentsService', async () => {
    const query = { page: 1, limit: 20 } as any;
    await controller.findAll(query);
    expect(incidentsService.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates retrieval to IncidentsService', async () => {
    await controller.findOne('inc-1');
    expect(incidentsService.findOne).toHaveBeenCalledWith('inc-1');
  });

  it('delegates update to IncidentsService', async () => {
    const dto = { title: 'New' } as any;
    await controller.update('inc-1', dto, actor);
    expect(incidentsService.update).toHaveBeenCalledWith('inc-1', dto, actor);
  });

  it('delegates status transitions to IncidentStatusService', async () => {
    const dto = { status: 'open', reason: 'triage' } as any;
    await controller.updateStatus('inc-1', dto, actor);
    expect(statusService.transition).toHaveBeenCalledWith('inc-1', 'open', actor, 'triage');
  });

  it('delegates assignment to IncidentAssignmentService', async () => {
    const dto = { assignedUserId: 'user-2' };
    await controller.assign('inc-1', dto, actor);
    expect(assignmentService.assign).toHaveBeenCalledWith('inc-1', 'user-2', actor);
  });

  it('delegates severity updates to IncidentsService', async () => {
    const dto = { severity: 'critical' } as any;
    await controller.updateSeverity('inc-1', dto, actor);
    expect(incidentsService.updateSeverity).toHaveBeenCalledWith('inc-1', 'critical', actor);
  });

  it('delegates priority updates to IncidentsService', async () => {
    const dto = { priority: 'p1' } as any;
    await controller.updatePriority('inc-1', dto, actor);
    expect(incidentsService.updatePriority).toHaveBeenCalledWith('inc-1', 'p1', actor);
  });

  it('delegates archive to IncidentsService', async () => {
    await controller.archive('inc-1', actor);
    expect(incidentsService.archive).toHaveBeenCalledWith('inc-1', actor);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';
import { IncidentsRepository } from '../repositories/incidents.repository';

describe('IncidentsRepository', () => {
  let repository: IncidentsRepository;
  const mockPrisma = {
    incident: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    incidentAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentsRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get(IncidentsRepository);
  });

  it('creates an incident via prisma', async () => {
    mockPrisma.incident.create.mockResolvedValue({ id: 'inc-1' });
    const result = await repository.create({ title: 't', description: 'd' } as any);
    expect(mockPrisma.incident.create).toHaveBeenCalledWith({
      data: { title: 't', description: 'd' },
    });
    expect(result).toEqual({ id: 'inc-1' });
  });

  it('excludes soft-deleted incidents by default on findById', async () => {
    mockPrisma.incident.findFirst.mockResolvedValue(null);
    await repository.findById('inc-1');
    expect(mockPrisma.incident.findFirst).toHaveBeenCalledWith({
      where: { id: 'inc-1', deleted: false },
    });
  });

  it('includes soft-deleted incidents when requested', async () => {
    mockPrisma.incident.findFirst.mockResolvedValue(null);
    await repository.findById('inc-1', true);
    expect(mockPrisma.incident.findFirst).toHaveBeenCalledWith({ where: { id: 'inc-1' } });
  });

  it('builds pagination metadata from total count', async () => {
    mockPrisma.incident.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    mockPrisma.incident.count.mockResolvedValue(45);

    const result = await repository.findMany(
      { status: 'open' as any },
      { page: 2, limit: 20 },
      { sortBy: 'createdAt', sortOrder: 'desc' },
    );

    expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
      where: { deleted: false, status: 'open' },
      orderBy: { createdAt: 'desc' },
      skip: 20,
      take: 20,
    });
    expect(result.meta).toEqual({ total: 45, page: 2, limit: 20, totalPages: 3 });
  });

  it('applies a full-text search OR filter', async () => {
    mockPrisma.incident.findMany.mockResolvedValue([]);
    mockPrisma.incident.count.mockResolvedValue(0);

    await repository.findMany(
      { search: '0xabc' },
      { page: 1, limit: 20 },
      { sortBy: 'createdAt', sortOrder: 'desc' },
    );

    const where = mockPrisma.incident.findMany.mock.calls[0][0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR.length).toBeGreaterThan(0);
  });

  it('soft-deletes by setting deleted flag and timestamp', async () => {
    mockPrisma.incident.update.mockResolvedValue({ id: 'inc-1', deleted: true });
    await repository.softDelete('inc-1');
    expect(mockPrisma.incident.update).toHaveBeenCalledWith({
      where: { id: 'inc-1' },
      data: { deleted: true, deletedAt: expect.any(Date) },
    });
  });

  it('writes an audit entry', async () => {
    mockPrisma.incidentAuditLog.create.mockResolvedValue({ id: 'audit-1' });
    await repository.addAuditEntry({
      incidentId: 'inc-1',
      action: IncidentAuditAction.CREATED,
      actorId: 'user-1',
    });
    expect(mockPrisma.incidentAuditLog.create).toHaveBeenCalledWith({
      data: {
        incidentId: 'inc-1',
        action: IncidentAuditAction.CREATED,
        actorId: 'user-1',
        actorName: undefined,
        previousValues: undefined,
        newValues: undefined,
      },
    });
  });
});

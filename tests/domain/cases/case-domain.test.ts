import {
  CaseStatus,
  CaseSeverity,
  CaseAssigneeRole,
  CreateCaseInput,
  UpdateCaseInput,
  CaseActivityLog,
} from '../../../src/domain/cases/types';
import { seedCases } from '../../../src/infrastructure/database/seeds/caseSeed';
import { PrismaClient } from '@prisma/client';

describe('Forensic Investigation & Case Management Domain Model (#126)', () => {
  describe('Domain Enums and Types', () => {
    it('should properly define all CaseStatus lifecycle enum values', () => {
      expect(CaseStatus.DRAFT).toBe('DRAFT');
      expect(CaseStatus.ACTIVE).toBe('ACTIVE');
      expect(CaseStatus.IN_REVIEW).toBe('IN_REVIEW');
      expect(CaseStatus.SUSPENDED).toBe('SUSPENDED');
      expect(CaseStatus.CLOSED).toBe('CLOSED');
      expect(CaseStatus.ARCHIVED).toBe('ARCHIVED');
    });

    it('should properly define all CaseSeverity enum values', () => {
      expect(CaseSeverity.LOW).toBe('LOW');
      expect(CaseSeverity.MEDIUM).toBe('MEDIUM');
      expect(CaseSeverity.HIGH).toBe('HIGH');
      expect(CaseSeverity.CRITICAL).toBe('CRITICAL');
    });

    it('should properly define all CaseAssigneeRole enum values', () => {
      expect(CaseAssigneeRole.INVESTIGATOR).toBe('INVESTIGATOR');
      expect(CaseAssigneeRole.LEGAL_OBSERVER).toBe('LEGAL_OBSERVER');
      expect(CaseAssigneeRole.EXTERNAL_AUDITOR).toBe('EXTERNAL_AUDITOR');
    });

    it('should structure CreateCaseInput payload correctly', () => {
      const input: CreateCaseInput = {
        caseNumber: 'CASE-2026-0891',
        title: 'Operation Horizon: DEX Liquidity Exploit',
        description: 'Forensic analysis of flash-loan exploit',
        status: CaseStatus.ACTIVE,
        severity: CaseSeverity.CRITICAL,
        leadInvestigatorId: 'user-uuid-1',
        nextReviewAt: new Date(),
        assigneeUserIds: [
          { userId: 'user-uuid-1', role: CaseAssigneeRole.INVESTIGATOR },
          { userId: 'user-uuid-2', role: CaseAssigneeRole.LEGAL_OBSERVER },
        ],
        incidentIds: ['incident-uuid-1', 'incident-uuid-2'],
        actorId: 'user-uuid-1',
        ipAddress: '127.0.0.1',
      };

      expect(input.caseNumber).toBe('CASE-2026-0891');
      expect(input.severity).toBe(CaseSeverity.CRITICAL);
      expect(input.assigneeUserIds).toHaveLength(2);
      expect(input.incidentIds).toContain('incident-uuid-1');
    });

    it('should structure UpdateCaseInput with status transitions and audit deltas', () => {
      const input: UpdateCaseInput = {
        status: CaseStatus.CLOSED,
        closedAt: new Date(),
        actorId: 'user-uuid-1',
        ipAddress: '192.168.1.50',
      };

      expect(input.status).toBe(CaseStatus.CLOSED);
      expect(input.closedAt).toBeInstanceOf(Date);
    });

    it('should capture structured JSON diffs in CaseActivityLog', () => {
      const log: CaseActivityLog = {
        id: 'log-uuid-1',
        caseId: 'case-uuid-1',
        actorId: 'user-uuid-1',
        action: 'status_transition',
        ipAddress: '10.0.0.1',
        changedFields: {
          status: { from: CaseStatus.DRAFT, to: CaseStatus.ACTIVE },
          severity: { from: CaseSeverity.MEDIUM, to: CaseSeverity.HIGH },
        },
        timestamp: new Date(),
      };

      expect(log.action).toBe('status_transition');
      expect(log.changedFields?.status.from).toBe(CaseStatus.DRAFT);
      expect(log.changedFields?.status.to).toBe(CaseStatus.ACTIVE);
    });
  });

  describe('Database Seed Script Pipeline', () => {
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        user: {
          upsert: jest
            .fn()
            .mockImplementation(({ create }) => Promise.resolve({ id: 'user-id', ...create })),
        },
        incident: {
          upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ ...create })),
        },
        case: {
          upsert: jest
            .fn()
            .mockImplementation(({ create }) => Promise.resolve({ id: 'case-id', ...create })),
        },
        caseAssignee: {
          upsert: jest
            .fn()
            .mockImplementation(({ create }) => Promise.resolve({ id: 'assignee-id', ...create })),
        },
        caseIncident: {
          upsert: jest
            .fn()
            .mockImplementation(({ create }) => Promise.resolve({ id: 'case-inc-id', ...create })),
        },
        caseActivityLog: {
          createMany: jest.fn().mockResolvedValue({ count: 4 }),
        },
      };
    });

    it('should execute seedCases and create users, cases, assignees, incidents, and activity logs', async () => {
      await seedCases(mockPrisma as unknown as PrismaClient);

      // Verify users seeded
      expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(4);

      // Verify incidents seeded
      expect(mockPrisma.incident.upsert).toHaveBeenCalledTimes(3);

      // Verify cases seeded
      expect(mockPrisma.case.upsert).toHaveBeenCalledTimes(3);

      // Verify assignees seeded
      expect(mockPrisma.caseAssignee.upsert).toHaveBeenCalledTimes(4);

      // Verify M:N case incidents linked
      expect(mockPrisma.caseIncident.upsert).toHaveBeenCalledTimes(3);

      // Verify activity logs with JSON diffs created
      expect(mockPrisma.caseActivityLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ action: 'case_created' }),
          expect.objectContaining({ action: 'status_transition' }),
          expect.objectContaining({ action: 'incident_linked' }),
          expect.objectContaining({ action: 'assignee_added' }),
        ]),
      });
    });
  });
});

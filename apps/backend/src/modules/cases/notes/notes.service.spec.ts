import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotesService } from './notes.service';

// ---------------------------------------------------------------------------
// Mock PrismaClient
// ---------------------------------------------------------------------------

const mockAuditLog = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({ auditLog: mockAuditLog })),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOTE_ID = 'note-abc';
const AUTHOR_ID = 'user-1';
const AUTHOR_NAME = 'Alice';
const CASE_ID = 'case-42';

const noteMetaBase = {
  type: 'investigation_note',
  caseId: CASE_ID,
  authorId: AUTHOR_ID,
  authorName: AUTHOR_NAME,
  title: 'Test Note',
  content: 'Initial content',
  tags: ['ioc'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deleted: false,
};

const noteRecord = {
  id: NOTE_ID,
  userId: AUTHOR_ID,
  action: 'note_record',
  actor: AUTHOR_NAME,
  metadata: noteMetaBase,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const auditRecord = {
  id: 'audit-1',
  userId: AUTHOR_ID,
  action: 'note_created',
  actor: AUTHOR_NAME,
  metadata: {
    noteId: NOTE_ID,
    action: 'created',
    previousValues: null,
    newValues: { content: 'Initial content' },
    timestamp: '2024-01-01T00:00:00.000Z',
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // createNote
  // ---------------------------------------------------------------------------

  describe('createNote', () => {
    it('should create a note and return it with an audit entry', async () => {
      // Prisma create is called twice: audit entry + note record
      mockAuditLog.create
        .mockResolvedValueOnce({ id: 'audit-1' }) // audit entry
        .mockResolvedValueOnce(noteRecord); // note record

      // getNoteAuditHistory will call findMany
      mockAuditLog.findMany.mockResolvedValue([auditRecord]);

      const result = await service.createNote({
        caseId: CASE_ID,
        authorId: AUTHOR_ID,
        authorName: AUTHOR_NAME,
        content: 'Initial content',
        title: 'Test Note',
        tags: ['ioc'],
      });

      expect(mockAuditLog.create).toHaveBeenCalledTimes(2);
      expect(result.caseId).toBe(CASE_ID);
      expect(result.content).toBe('Initial content');
      expect(result.auditHistory).toHaveLength(1);
      expect(result.auditHistory[0].action).toBe('created');
    });
  });

  // ---------------------------------------------------------------------------
  // getNotesByCase
  // ---------------------------------------------------------------------------

  describe('getNotesByCase', () => {
    it('should return only non-deleted notes for the requested case', async () => {
      const deletedMeta = { ...noteMetaBase, caseId: CASE_ID, deleted: true };
      const otherCaseMeta = { ...noteMetaBase, caseId: 'case-99', deleted: false };

      mockAuditLog.findMany
        .mockResolvedValueOnce([
          noteRecord,
          { ...noteRecord, id: 'note-deleted', metadata: deletedMeta },
          { ...noteRecord, id: 'note-other', metadata: otherCaseMeta },
        ])
        // For each note, hydrateNoteWithAudit calls getNoteAuditHistory which calls findUnique + findMany
        .mockResolvedValue([auditRecord]);

      mockAuditLog.findUnique.mockResolvedValue(noteRecord);

      const results = await service.getNotesByCase(CASE_ID);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(NOTE_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // getNoteById
  // ---------------------------------------------------------------------------

  describe('getNoteById', () => {
    it('should return a note by ID', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);
      mockAuditLog.findMany.mockResolvedValue([auditRecord]);

      const result = await service.getNoteById(NOTE_ID);

      expect(result.id).toBe(NOTE_ID);
      expect(mockAuditLog.findUnique).toHaveBeenCalledWith({ where: { id: NOTE_ID } });
    });

    it('should throw NotFoundException for a missing note', async () => {
      mockAuditLog.findUnique.mockResolvedValue(null);

      await expect(service.getNoteById('missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for a deleted note', async () => {
      const deletedRecord = {
        ...noteRecord,
        metadata: { ...noteMetaBase, deleted: true },
      };
      mockAuditLog.findUnique.mockResolvedValue(deletedRecord);

      await expect(service.getNoteById(NOTE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateNote
  // ---------------------------------------------------------------------------

  describe('updateNote', () => {
    it('should update a note and append an audit entry', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);
      mockAuditLog.update.mockResolvedValue({});
      mockAuditLog.create.mockResolvedValue({ id: 'audit-2' });
      mockAuditLog.findMany.mockResolvedValue([auditRecord]);

      const result = await service.updateNote(NOTE_ID, AUTHOR_ID, AUTHOR_NAME, {
        content: 'Updated content',
      });

      expect(mockAuditLog.update).toHaveBeenCalled();
      expect(mockAuditLog.create).toHaveBeenCalledTimes(1);
      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when note is missing', async () => {
      mockAuditLog.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNote('missing', AUTHOR_ID, AUTHOR_NAME, { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when actor is not the author', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);

      await expect(
        service.updateNote(NOTE_ID, 'user-999', 'Eve', { content: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteNote
  // ---------------------------------------------------------------------------

  describe('deleteNote', () => {
    it('should soft-delete a note and append an audit entry', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);
      mockAuditLog.update.mockResolvedValue({});
      mockAuditLog.create.mockResolvedValue({ id: 'audit-3' });

      await service.deleteNote(NOTE_ID, AUTHOR_ID, AUTHOR_NAME);

      expect(mockAuditLog.update).toHaveBeenCalled();
      expect(mockAuditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when actor is not the author', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);

      await expect(service.deleteNote(NOTE_ID, 'user-999', 'Eve')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getNoteAuditHistory
  // ---------------------------------------------------------------------------

  describe('getNoteAuditHistory', () => {
    it('should return ordered audit entries for a note', async () => {
      mockAuditLog.findUnique.mockResolvedValue(noteRecord);
      mockAuditLog.findMany.mockResolvedValue([auditRecord]);

      const history = await service.getNoteAuditHistory(NOTE_ID);

      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('created');
      expect(history[0].noteId).toBe(NOTE_ID);
    });

    it('should throw NotFoundException for a missing note', async () => {
      mockAuditLog.findUnique.mockResolvedValue(null);

      await expect(service.getNoteAuditHistory('missing')).rejects.toThrow(NotFoundException);
    });
  });
});

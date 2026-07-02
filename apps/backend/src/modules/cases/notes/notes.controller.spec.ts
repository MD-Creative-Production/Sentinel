import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

const CASE_ID = 'case-42';
const NOTE_ID = 'note-abc';

const mockNote = {
  id: NOTE_ID,
  caseId: CASE_ID,
  authorId: 'user-1',
  authorName: 'Alice',
  title: 'Test Note',
  content: 'Initial content',
  tags: ['ioc'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  auditHistory: [],
};

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: {
            createNote: jest.fn().mockResolvedValue(mockNote),
            getNotesByCase: jest.fn().mockResolvedValue([mockNote]),
            getNoteById: jest.fn().mockResolvedValue(mockNote),
            updateNote: jest.fn().mockResolvedValue({ ...mockNote, content: 'Updated' }),
            deleteNote: jest.fn().mockResolvedValue(undefined),
            getNoteAuditHistory: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNote', () => {
    it('should call NotesService.createNote with merged caseId', async () => {
      const dto = { authorId: 'user-1', authorName: 'Alice', content: 'Hello' };
      const result = await controller.createNote(CASE_ID, dto);
      expect(service.createNote).toHaveBeenCalledWith({ ...dto, caseId: CASE_ID });
      expect(result).toEqual(mockNote);
    });
  });

  describe('getNotesByCase', () => {
    it('should call NotesService.getNotesByCase', async () => {
      const result = await controller.getNotesByCase(CASE_ID);
      expect(service.getNotesByCase).toHaveBeenCalledWith(CASE_ID);
      expect(result).toEqual([mockNote]);
    });
  });

  describe('getNoteById', () => {
    it('should call NotesService.getNoteById with noteId', async () => {
      const result = await controller.getNoteById(CASE_ID, NOTE_ID);
      expect(service.getNoteById).toHaveBeenCalledWith(NOTE_ID);
      expect(result).toEqual(mockNote);
    });
  });

  describe('updateNote', () => {
    it('should strip actorId/actorName from body and call updateNote', async () => {
      const body = { actorId: 'user-1', actorName: 'Alice', content: 'Updated' };
      const result = await controller.updateNote(CASE_ID, NOTE_ID, body);
      expect(service.updateNote).toHaveBeenCalledWith(NOTE_ID, 'user-1', 'Alice', {
        content: 'Updated',
      });
      expect(result).toMatchObject({ content: 'Updated' });
    });
  });

  describe('deleteNote', () => {
    it('should call NotesService.deleteNote', async () => {
      await controller.deleteNote(CASE_ID, NOTE_ID, { actorId: 'user-1', actorName: 'Alice' });
      expect(service.deleteNote).toHaveBeenCalledWith(NOTE_ID, 'user-1', 'Alice');
    });
  });

  describe('getNoteAuditHistory', () => {
    it('should call NotesService.getNoteAuditHistory', async () => {
      const result = await controller.getNoteAuditHistory(CASE_ID, NOTE_ID);
      expect(service.getNoteAuditHistory).toHaveBeenCalledWith(NOTE_ID);
      expect(result).toEqual([]);
    });
  });
});

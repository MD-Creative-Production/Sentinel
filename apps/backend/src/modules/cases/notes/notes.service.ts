import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateNoteDto,
  UpdateNoteDto,
  InvestigationNote,
  NoteAuditEntry,
} from './interfaces/note.interface';

/**
 * Service responsible for creating, editing, retrieving, and auditing
 * investigation notes attached to security cases.
 *
 * Notes are immutably append-audited on every write so that the full
 * change history is preserved for compliance and forensic purposes.
 */
@Injectable()
export class NotesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Create a new investigation note for a given case.
   * An audit entry with action "created" is appended automatically.
   *
   * @param dto - Fields required to create the note
   * @returns The newly created note with its initial audit entry
   */
  async createNote(dto: CreateNoteDto): Promise<InvestigationNote> {
    const noteId = this.generateId('note');
    const auditId = this.generateId('audit');
    const now = new Date().toISOString();

    const newValues: Record<string, any> = {
      caseId: dto.caseId,
      authorId: dto.authorId,
      authorName: dto.authorName,
      title: dto.title ?? null,
      content: dto.content,
      tags: dto.tags ?? [],
    };

    await this.prisma.auditLog.create({
      data: {
        id: auditId,
        userId: dto.authorId,
        action: 'note_created',
        actor: dto.authorName,
        metadata: {
          noteId,
          action: 'created',
          previousValues: null,
          newValues,
          timestamp: now,
        },
      },
    });

    // Persist the note itself in the AuditLog metadata as the source-of-truth
    // until a dedicated Note table is added via a migration.
    const noteRecord = await this.prisma.auditLog.create({
      data: {
        id: noteId,
        userId: dto.authorId,
        action: 'note_record',
        actor: dto.authorName,
        metadata: {
          type: 'investigation_note',
          caseId: dto.caseId,
          authorId: dto.authorId,
          authorName: dto.authorName,
          title: dto.title ?? null,
          content: dto.content,
          tags: dto.tags ?? [],
          createdAt: now,
          updatedAt: now,
          deleted: false,
        },
      },
    });

    return this.formatNote(noteRecord, [
      this.buildAuditEntry(
        auditId,
        noteId,
        'created',
        dto.authorId,
        dto.authorName,
        null,
        newValues,
        now,
      ),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /**
   * Retrieve all active (non-deleted) notes for a specific case,
   * ordered newest-first.
   *
   * @param caseId - ID of the case to query
   * @returns Array of investigation notes with their audit histories
   */
  async getNotesByCase(caseId: string): Promise<InvestigationNote[]> {
    const records = await this.prisma.auditLog.findMany({
      where: {
        action: 'note_record',
      },
      orderBy: { createdAt: 'desc' },
    });

    const caseNotes = records.filter(r => {
      const meta = r.metadata as Record<string, any>;
      return meta?.type === 'investigation_note' && meta?.caseId === caseId && !meta?.deleted;
    });

    return Promise.all(caseNotes.map(record => this.hydrateNoteWithAudit(record)));
  }

  /**
   * Retrieve a single note by its ID.
   *
   * @param noteId - The note's unique identifier
   * @returns The investigation note with full audit history
   * @throws NotFoundException if the note does not exist or has been deleted
   */
  async getNoteById(noteId: string): Promise<InvestigationNote> {
    const record = await this.prisma.auditLog.findUnique({
      where: { id: noteId },
    });

    if (!record || (record.metadata as any)?.type !== 'investigation_note') {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    if ((record.metadata as any)?.deleted) {
      throw new NotFoundException(`Note ${noteId} has been deleted`);
    }

    return this.hydrateNoteWithAudit(record);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * Edit an existing note's content, title, or tags.
   * Only the original author may update the note.
   * An audit entry with action "updated" is automatically appended.
   *
   * @param noteId   - ID of the note to update
   * @param actorId  - ID of the user making the change
   * @param actorName - Display name of the actor
   * @param dto      - Fields to update
   * @returns The updated note with appended audit entry
   * @throws NotFoundException  if the note does not exist
   * @throws ForbiddenException if actorId is not the note's author
   */
  async updateNote(
    noteId: string,
    actorId: string,
    actorName: string,
    dto: UpdateNoteDto,
  ): Promise<InvestigationNote> {
    const record = await this.prisma.auditLog.findUnique({ where: { id: noteId } });

    if (!record || (record.metadata as any)?.type !== 'investigation_note') {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    const meta = record.metadata as Record<string, any>;

    if (meta.deleted) {
      throw new NotFoundException(`Note ${noteId} has been deleted`);
    }

    if (meta.authorId !== actorId) {
      throw new ForbiddenException('Only the note author may edit this note');
    }

    const previousValues: Record<string, any> = {
      content: meta.content,
      title: meta.title,
      tags: meta.tags,
    };

    const updatedMeta = {
      ...meta,
      content: dto.content ?? meta.content,
      title: dto.title !== undefined ? dto.title : meta.title,
      tags: dto.tags ?? meta.tags,
      updatedAt: new Date().toISOString(),
    };

    const newValues: Record<string, any> = {
      content: updatedMeta.content,
      title: updatedMeta.title,
      tags: updatedMeta.tags,
    };

    // Update the note record in-place
    await this.prisma.auditLog.update({
      where: { id: noteId },
      data: { metadata: updatedMeta },
    });

    // Append an audit entry
    const auditId = this.generateId('audit');
    const now = new Date().toISOString();

    await this.prisma.auditLog.create({
      data: {
        id: auditId,
        userId: actorId,
        action: 'note_updated',
        actor: actorName,
        metadata: {
          noteId,
          action: 'updated',
          previousValues,
          newValues,
          timestamp: now,
        },
      },
    });

    return this.hydrateNoteWithAudit({ ...record, metadata: updatedMeta });
  }

  // ---------------------------------------------------------------------------
  // Delete (soft)
  // ---------------------------------------------------------------------------

  /**
   * Soft-delete a note by setting the `deleted` flag.
   * Only the original author may delete the note.
   * An audit entry with action "deleted" is appended.
   *
   * @param noteId    - ID of the note to delete
   * @param actorId   - ID of the user requesting deletion
   * @param actorName - Display name of the actor
   * @throws NotFoundException  if the note does not exist
   * @throws ForbiddenException if actorId is not the note's author
   */
  async deleteNote(noteId: string, actorId: string, actorName: string): Promise<void> {
    const record = await this.prisma.auditLog.findUnique({ where: { id: noteId } });

    if (!record || (record.metadata as any)?.type !== 'investigation_note') {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    const meta = record.metadata as Record<string, any>;

    if (meta.deleted) {
      throw new NotFoundException(`Note ${noteId} has already been deleted`);
    }

    if (meta.authorId !== actorId) {
      throw new ForbiddenException('Only the note author may delete this note');
    }

    const deletedAt = new Date().toISOString();

    await this.prisma.auditLog.update({
      where: { id: noteId },
      data: { metadata: { ...meta, deleted: true, deletedAt } },
    });

    const auditId = this.generateId('audit');

    await this.prisma.auditLog.create({
      data: {
        id: auditId,
        userId: actorId,
        action: 'note_deleted',
        actor: actorName,
        metadata: {
          noteId,
          action: 'deleted',
          previousValues: { deleted: false },
          newValues: { deleted: true, deletedAt },
          timestamp: deletedAt,
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Audit history
  // ---------------------------------------------------------------------------

  /**
   * Return the complete, ordered audit trail for a specific note.
   *
   * @param noteId - The note whose history to retrieve
   * @returns Chronological list of audit entries
   * @throws NotFoundException if the note does not exist
   */
  async getNoteAuditHistory(noteId: string): Promise<NoteAuditEntry[]> {
    // Verify the note exists
    const record = await this.prisma.auditLog.findUnique({ where: { id: noteId } });
    if (!record || (record.metadata as any)?.type !== 'investigation_note') {
      throw new NotFoundException(`Note ${noteId} not found`);
    }

    const auditRecords = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['note_created', 'note_updated', 'note_deleted'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return auditRecords
      .filter(r => (r.metadata as any)?.noteId === noteId)
      .map(r => {
        const m = r.metadata as Record<string, any>;
        return this.buildAuditEntry(
          r.id,
          noteId,
          m.action as 'created' | 'updated' | 'deleted',
          r.userId,
          r.actor,
          m.previousValues ?? null,
          m.newValues,
          m.timestamp ?? r.createdAt.toISOString(),
        );
      });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async hydrateNoteWithAudit(record: any): Promise<InvestigationNote> {
    const auditHistory = await this.getNoteAuditHistory(record.id);
    return this.formatNote(record, auditHistory);
  }

  private formatNote(record: any, auditHistory: NoteAuditEntry[]): InvestigationNote {
    const meta = record.metadata as Record<string, any>;
    return {
      id: record.id,
      caseId: meta.caseId,
      authorId: meta.authorId,
      authorName: meta.authorName,
      title: meta.title ?? null,
      content: meta.content,
      tags: meta.tags ?? [],
      createdAt: meta.createdAt ?? record.createdAt?.toISOString(),
      updatedAt: meta.updatedAt ?? record.createdAt?.toISOString(),
      auditHistory,
    };
  }

  private buildAuditEntry(
    id: string,
    noteId: string,
    action: 'created' | 'updated' | 'deleted',
    actorId: string,
    actorName: string,
    previousValues: Record<string, any> | null,
    newValues: Record<string, any>,
    timestamp: string,
  ): NoteAuditEntry {
    return { id, noteId, action, actorId, actorName, previousValues, newValues, timestamp };
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

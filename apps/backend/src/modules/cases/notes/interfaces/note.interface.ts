/**
 * Data transfer object for creating a new investigation note.
 */
export interface CreateNoteDto {
  /** The case/investigation ID this note belongs to */
  caseId: string;
  /** ID of the user creating the note */
  authorId: string;
  /** Display name or handle of the author */
  authorName: string;
  /** Main body content of the note */
  content: string;
  /** Optional title for the note */
  title?: string;
  /** Optional tags for categorisation (e.g. "ioc", "remediation") */
  tags?: string[];
}

/**
 * Data transfer object for updating an existing investigation note.
 */
export interface UpdateNoteDto {
  /** Updated content of the note */
  content?: string;
  /** Updated title of the note */
  title?: string;
  /** Updated tags */
  tags?: string[];
}

/**
 * Represents a single immutable entry in the audit history of a note.
 */
export interface NoteAuditEntry {
  /** Unique identifier of this audit record */
  id: string;
  /** ID of the note being audited */
  noteId: string;
  /** The field-level action that occurred */
  action: 'created' | 'updated' | 'deleted';
  /** ID of the user who performed the action */
  actorId: string;
  /** Display name of the actor */
  actorName: string;
  /** Snapshot of field values before the change (null on creation) */
  previousValues: Record<string, any> | null;
  /** Snapshot of field values after the change */
  newValues: Record<string, any>;
  /** ISO timestamp of when the action occurred */
  timestamp: string;
}

/**
 * Full representation of an investigation note, including its audit history.
 */
export interface InvestigationNote {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  title: string | null;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Ordered audit trail for this note */
  auditHistory: NoteAuditEntry[];
}

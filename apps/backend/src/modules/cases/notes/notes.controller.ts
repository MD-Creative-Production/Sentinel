import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './interfaces/note.interface';

/**
 * REST controller that exposes investigation-notes endpoints under
 * `/cases/:caseId/notes`.
 *
 * All routes are scoped to a specific case so that access-control
 * policies can be enforced at the case level by upstream middleware.
 */
@Controller('cases/:caseId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * POST /cases/:caseId/notes
   * Create a new investigation note for the specified case.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNote(@Param('caseId') caseId: string, @Body() dto: Omit<CreateNoteDto, 'caseId'>) {
    return this.notesService.createNote({ ...dto, caseId });
  }

  /**
   * GET /cases/:caseId/notes
   * List all active notes for the specified case.
   */
  @Get()
  async getNotesByCase(@Param('caseId') caseId: string) {
    return this.notesService.getNotesByCase(caseId);
  }

  /**
   * GET /cases/:caseId/notes/:noteId
   * Retrieve a single note by ID.
   */
  @Get(':noteId')
  async getNoteById(@Param('caseId') _caseId: string, @Param('noteId') noteId: string) {
    return this.notesService.getNoteById(noteId);
  }

  /**
   * PUT /cases/:caseId/notes/:noteId
   * Update the content, title, or tags of an existing note.
   * Body must include `actorId` and `actorName` for access-control and auditing.
   */
  @Put(':noteId')
  async updateNote(
    @Param('caseId') _caseId: string,
    @Param('noteId') noteId: string,
    @Body() body: UpdateNoteDto & { actorId: string; actorName: string },
  ) {
    const { actorId, actorName, ...dto } = body;
    return this.notesService.updateNote(noteId, actorId, actorName, dto);
  }

  /**
   * DELETE /cases/:caseId/notes/:noteId
   * Soft-delete a note. Requires `actorId` and `actorName` in the body.
   */
  @Delete(':noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(
    @Param('caseId') _caseId: string,
    @Param('noteId') noteId: string,
    @Body() body: { actorId: string; actorName: string },
  ) {
    await this.notesService.deleteNote(noteId, body.actorId, body.actorName);
  }

  /**
   * GET /cases/:caseId/notes/:noteId/history
   * Retrieve the complete audit history for a single note.
   */
  @Get(':noteId/history')
  async getNoteAuditHistory(@Param('caseId') _caseId: string, @Param('noteId') noteId: string) {
    return this.notesService.getNoteAuditHistory(noteId);
  }
}

import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

/**
 * NestJS module that encapsulates the Investigation Notes feature.
 * Import this module into AppModule (or a parent CasesModule) to activate
 * the notes REST endpoints and service.
 */
@Module({
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}

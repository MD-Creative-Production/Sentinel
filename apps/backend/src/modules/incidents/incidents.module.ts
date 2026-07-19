import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncidentsController } from './controllers/incidents.controller';
import { IncidentsRepository } from './repositories/incidents.repository';
import { IncidentAssignmentService } from './services/incident-assignment.service';
import { IncidentStatusService } from './services/incident-status.service';
import { IncidentsService } from './services/incidents.service';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [IncidentsController],
  providers: [
    IncidentsRepository,
    IncidentsService,
    IncidentStatusService,
    IncidentAssignmentService,
  ],
  exports: [IncidentsService],
})
export class IncidentsModule {}

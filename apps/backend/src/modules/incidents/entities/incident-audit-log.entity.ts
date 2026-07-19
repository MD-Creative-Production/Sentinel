import { ApiProperty } from '@nestjs/swagger';
import { IncidentAuditAction } from '../enums/incident-audit-action.enum';

export class IncidentAuditLogEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  incidentId!: string;

  @ApiProperty({ enum: IncidentAuditAction })
  action!: IncidentAuditAction;

  @ApiProperty()
  actorId!: string;

  @ApiProperty({ required: false, nullable: true })
  actorName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  previousValues?: Record<string, unknown> | null;

  @ApiProperty({ required: false, nullable: true })
  newValues?: Record<string, unknown> | null;

  @ApiProperty()
  timestamp!: Date;
}

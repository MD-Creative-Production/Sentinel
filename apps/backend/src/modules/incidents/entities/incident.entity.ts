import { ApiProperty } from '@nestjs/swagger';
import { IncidentPriority } from '../enums/incident-priority.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export class IncidentEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: IncidentStatus })
  status!: IncidentStatus;

  @ApiProperty({ enum: IncidentSeverity })
  severity!: IncidentSeverity;

  @ApiProperty({ enum: IncidentPriority })
  priority!: IncidentPriority;

  @ApiProperty({ required: false, nullable: true })
  category?: string | null;

  @ApiProperty({ required: false, nullable: true })
  organizationId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  assignedUserId?: string | null;

  @ApiProperty({ type: [String] })
  sourceAlertIds!: string[];

  @ApiProperty({ required: false, nullable: true })
  detectionSource?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  deleted!: boolean;

  @ApiProperty({ required: false, nullable: true })
  deletedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false, nullable: true })
  resolvedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  closedAt?: Date | null;
}

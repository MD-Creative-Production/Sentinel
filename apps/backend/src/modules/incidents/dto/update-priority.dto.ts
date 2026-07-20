import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentPriority } from '../enums/incident-priority.enum';

export class UpdatePriorityDto {
  @ApiProperty({ enum: IncidentPriority })
  @IsEnum(IncidentPriority)
  priority!: IncidentPriority;
}

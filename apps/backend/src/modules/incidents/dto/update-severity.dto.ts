import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentSeverity } from '../enums/incident-severity.enum';

export class UpdateSeverityDto {
  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;
}

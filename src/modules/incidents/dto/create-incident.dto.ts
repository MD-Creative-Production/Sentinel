import { IsString, IsEnum } from 'class-validator';
import { IncidentStatus, IncidentSeverity } from '../enums';

export class CreateIncidentDto {
  @IsString()
  title: string;

  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;
}
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IncidentStatus, IncidentSeverity } from '../enums';

export class UpdateIncidentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;
}
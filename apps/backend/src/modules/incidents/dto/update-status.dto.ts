import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiPropertyOptional({ description: 'Optional note explaining the transition' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResendInvitationDto {
  @ApiPropertyOptional({ description: 'Optional note recorded in the audit log for this resend' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

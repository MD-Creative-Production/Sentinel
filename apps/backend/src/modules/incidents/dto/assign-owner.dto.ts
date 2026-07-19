import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignOwnerDto {
  @ApiPropertyOptional({
    description: 'User ID to assign as owner. Omit or pass null to remove the current assignee.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  assignedUserId?: string | null;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Organization the invitee is being invited into' })
  @IsString()
  organizationId!: string;

  @ApiProperty({ example: 'new.member@example.com' })
  @IsEmail()
  inviteeEmail!: string;

  @ApiProperty({ enum: Role, example: Role.ANALYST })
  @IsEnum(Role)
  role!: Role;
}

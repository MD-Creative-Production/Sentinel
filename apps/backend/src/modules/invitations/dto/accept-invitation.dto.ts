import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Raw invitation token, as delivered in the invite link' })
  @IsString()
  @MinLength(32)
  token!: string;

  @ApiProperty({ example: 'new.member@example.com' })
  @IsEmail()
  email!: string;
}

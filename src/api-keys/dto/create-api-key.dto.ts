import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

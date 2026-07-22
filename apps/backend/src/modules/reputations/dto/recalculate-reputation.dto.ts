import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RecalculateReputationDto {
  @IsString()
  chainId: string;

  /**
   * Bypasses the TTL cache check and forces a fresh calculation even if a
   * recent score already exists. Defaults to false to avoid needlessly
   * hammering the chain-data integrations on every request.
   */
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;
}

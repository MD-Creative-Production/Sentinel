import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DEFAULT_HISTORY_PAGE_SIZE, MAX_HISTORY_PAGE_SIZE } from '../constants/reputation.constants';

export class QueryReputationHistoryDto {
  @IsOptional()
  @IsString()
  chainId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_HISTORY_PAGE_SIZE)
  limit: number = DEFAULT_HISTORY_PAGE_SIZE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

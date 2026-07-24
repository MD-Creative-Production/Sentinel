import { Exclude, Expose, Type } from 'class-transformer';
import { ReputationTier } from '../constants/reputation.constants';
import { ReputationBreakdown, RiskIndicator } from '../interfaces/reputation.interfaces';

@Exclude()
export class ReputationScoreResponseDto {
  @Expose()
  walletAddress: string;

  @Expose()
  chainId: string;

  @Expose()
  score: number;

  @Expose()
  tier: ReputationTier;

  @Expose()
  breakdown: ReputationBreakdown;

  @Expose()
  indicators: RiskIndicator[];

  @Expose()
  @Type(() => Date)
  calculatedAt: Date;
}

@Exclude()
export class ReputationHistoryItemDto {
  @Expose()
  score: number;

  @Expose()
  tier: ReputationTier;

  @Expose()
  @Type(() => Date)
  calculatedAt: Date;
}

@Exclude()
export class PaginatedReputationHistoryDto {
  @Expose()
  @Type(() => ReputationHistoryItemDto)
  items: ReputationHistoryItemDto[];

  @Expose()
  total: number;

  @Expose()
  limit: number;

  @Expose()
  offset: number;
}

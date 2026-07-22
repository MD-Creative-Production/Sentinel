/**
 * src/modules/reputation/reputation.controller.ts
 *
 * NOTE: Swap in the project's real auth guard (e.g. `ApiKeyGuard` from
 * `src/modules/api-keys`) in place of the placeholder import below once
 * merged — left explicit rather than silently unguarded.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ReputationService } from './reputation.service';
// import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { QueryReputationHistoryDto } from './dto/query-reputation-history.dto';
import { RecalculateReputationDto } from './dto/recalculate-reputation.dto';
import {
  PaginatedReputationHistoryDto,
  ReputationScoreResponseDto,
} from './dto/reputation-score-response.dto';
import { ReputationTier } from './constants/reputation.constants';

@Controller('reputation')
// @UseGuards(ApiKeyGuard)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  /**
   * GET /reputation/:walletAddress?chainId=stellar
   * Returns the current (cached-or-fresh) reputation score for a wallet.
   */
  @Get(':walletAddress')
  async getScore(
    @Param('walletAddress') walletAddress: string,
    @Query('chainId') chainId: string,
  ): Promise<ReputationScoreResponseDto> {
    const result = await this.reputationService.getScore(walletAddress, chainId);
    return plainToInstance(ReputationScoreResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * POST /reputation/:walletAddress/recalculate
   * Forces a fresh score calculation, bypassing the cache TTL.
   */
  @Post(':walletAddress/recalculate')
  async recalculate(
    @Param('walletAddress') walletAddress: string,
    @Body() dto: RecalculateReputationDto,
  ): Promise<ReputationScoreResponseDto> {
    const result = await this.reputationService.recalculate(walletAddress, dto.chainId);
    return plainToInstance(ReputationScoreResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * GET /reputation/:walletAddress/history?chainId=stellar&limit=20&offset=0
   * Returns paginated historical score snapshots for a wallet.
   */
  @Get(':walletAddress/history')
  async getHistory(
    @Param('walletAddress') walletAddress: string,
    @Query() query: QueryReputationHistoryDto,
  ): Promise<PaginatedReputationHistoryDto> {
    const { items, total } = await this.reputationService.getHistory(
      walletAddress,
      query.chainId,
      query.limit,
      query.offset,
    );

    return plainToInstance(
      PaginatedReputationHistoryDto,
      { items, total, limit: query.limit, offset: query.offset },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * GET /reputation/tier/:tier?chainId=stellar&limit=50
   * Lists the most recently scored wallets in a given trust tier — used
   * by dashboards/alerts to surface HIGH_RISK wallets, for example.
   */
  @Get('tier/:tier')
  async listByTier(
    @Param('tier') tier: ReputationTier,
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.reputationService.listByTier(tier, chainId, limit ? Number(limit) : undefined);
  }
}

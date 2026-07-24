/**
 * src/modules/reputation/repository/reputation.repository.ts
 *
 * NOTE: This assumes a `PrismaService` exposed from the project's
 * `database` module (matching the `src/database` folder already in the
 * repo) with a `reputationScore` model as added in
 * `prisma/reputation.prisma.snippet` (see PR description). If the project
 * instead uses TypeORM, swap this repository's internals for a
 * `Repository<ReputationScoreEntity>` — the public method signatures
 * (used by ReputationService) would not need to change.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ReputationScoreResult } from '../interfaces/reputation.interfaces';
import { ReputationTier } from '../constants/reputation.constants';

@Injectable()
export class ReputationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(walletAddress: string, chainId: string) {
    return this.prisma.reputationScore.findFirst({
      where: { walletAddress, chainId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async saveSnapshot(result: ReputationScoreResult) {
    return this.prisma.reputationScore.create({
      data: {
        walletAddress: result.walletAddress,
        chainId: result.chainId,
        score: result.score,
        tier: result.tier,
        breakdown: result.breakdown as unknown as object,
        indicators: result.indicators as unknown as object[],
        calculatedAt: result.calculatedAt,
      },
    });
  }

  async findHistory(
    walletAddress: string,
    chainId: string | undefined,
    limit: number,
    offset: number,
  ) {
    const where = chainId ? { walletAddress, chainId } : { walletAddress };

    const [items, total] = await Promise.all([
      this.prisma.reputationScore.findMany({
        where,
        orderBy: { calculatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.reputationScore.count({ where }),
    ]);

    return { items, total };
  }

  async findByTier(tier: ReputationTier, chainId?: string, limit = 50) {
    return this.prisma.reputationScore.findMany({
      where: chainId ? { tier, chainId } : { tier },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
      distinct: ['walletAddress'],
    });
  }
}

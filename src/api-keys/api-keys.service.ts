import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';

export interface CreateApiKeyResult {
  id: string;
  name: string;
  key: string;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new API key.
   *
   * The plaintext key is returned exactly once and is never stored.
   */
  async create(userId: string, name: string, expiresAt?: Date | null): Promise<CreateApiKeyResult> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new ConflictException('API key name is required');
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('API key expiration date must be in the future');
    }

    const plaintextKey = this.generateApiKey();
    const keyHash = this.hashApiKey(plaintextKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: normalizedName,
        keyHash,
        expiresAt: expiresAt ?? null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: plaintextKey,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validates an API key and returns its owning user.
   */
  async validate(key: string) {
    if (!key?.trim()) {
      throw new UnauthorizedException('API key is required');
    }

    const keyHash = this.hashApiKey(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        keyHash,
      },
      include: {
        user: true,
      },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('API key has expired');
    }

    await this.prisma.apiKey.update({
      where: {
        id: apiKey.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return apiKey.user;
  }

  /**
   * Revokes an API key without deleting its audit/history record.
   */
  async revoke(userId: string, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.revokedAt) {
      return apiKey;
    }

    return this.prisma.apiKey.update({
      where: {
        id: apiKey.id,
      },
      data: {
        revokedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Lists API keys belonging to a user.
   *
   * Never returns keyHash.
   */
  async findAll(userId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private generateApiKey(): string {
    return `sk_live_${randomBytes(32).toString('hex')}`;
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

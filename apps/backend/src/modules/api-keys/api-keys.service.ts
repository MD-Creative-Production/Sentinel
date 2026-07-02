import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { CreateApiKeyDto, ApiKeyResponseDto, ApiKeyUsageDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private generateKey(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private getKeyPreview(key: string): string {
    return key.slice(-4);
  }

  async createApiKey(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto & { key: string }> {
    const key = this.generateKey();
    const keyHash = this.hashKey(key);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        key: keyHash,
        keyHash,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key,
      keyPreview: this.getKeyPreview(key),
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
    };
  }

  async getApiKeys(userId: string): Promise<ApiKeyResponseDto[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: key.keyHash.slice(-4),
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
    }));
  }

  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    if (apiKey.userId !== userId) {
      throw new ConflictException(`Unauthorized access to API key`);
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }

  async validateAndUpdateUsage(key: string): Promise<string | null> {
    const keyHash = this.hashKey(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || apiKey.revokedAt) {
      return null;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey.userId;
  }

  async getApiKeyUsage(userId: string, keyId: string): Promise<ApiKeyUsageDto> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new NotFoundException(`API key not found`);
    }

    // Placeholder for actual usage tracking
    const requestCount = 0;

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.keyHash.slice(-4),
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      requestCount,
    };
  }
}

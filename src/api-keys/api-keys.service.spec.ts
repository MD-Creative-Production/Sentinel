import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  const prisma = {
    apiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApiKeysService(prisma as any);
  });

  describe('create', () => {
    it('creates an API key with an expiration date', async () => {
      const expiresAt = new Date(Date.now() + 86_400_000);

      prisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'Production',
        expiresAt,
        createdAt: new Date(),
      });

      const result = await service.create('user-1', 'Production', expiresAt);

      expect(prisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            name: 'Production',
            expiresAt,
            keyHash: expect.any(String),
          }),
        }),
      );

      expect(result.key).toMatch(/^sk_live_/);
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('rejects an expired creation date', async () => {
      const expiresAt = new Date(Date.now() - 1_000);

      await expect(service.create('user-1', 'Expired', expiresAt)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prisma.apiKey.create).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('rejects an unknown API key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(service.validate('sk_live_invalid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a revoked API key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        revokedAt: new Date(),
        expiresAt: null,
        user: {
          id: 'user-1',
        },
      });

      await expect(service.validate('sk_live_revoked')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired API key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        user: {
          id: 'user-1',
        },
      });

      await expect(service.validate('sk_live_expired')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('updates lastUsedAt for a valid API key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        revokedAt: null,
        expiresAt: null,
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      });

      const user = await service.validate('sk_live_valid');

      expect(user.id).toBe('user-1');
      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'key-1',
          },
          data: {
            lastUsedAt: expect.any(Date),
          },
        }),
      );
    });
  });

  describe('revoke', () => {
    it('rejects an API key owned by another user', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('user-1', 'key-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('revokes an owned API key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue({
        id: 'key-1',
        revokedAt: null,
      });

      prisma.apiKey.update.mockResolvedValue({
        id: 'key-1',
        name: 'Production',
        expiresAt: null,
        lastUsedAt: null,
        revokedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.revoke('user-1', 'key-1');

      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'key-1',
          },
          data: {
            revokedAt: expect.any(Date),
          },
        }),
      );

      expect(result.id).toBe('key-1');
    });
  });
});

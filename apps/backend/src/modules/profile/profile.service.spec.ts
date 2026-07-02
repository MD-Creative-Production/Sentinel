import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    watchlist: {
      count: jest.fn(),
    },
    alert: {
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: PrismaClient;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    createdAt: new Date('2026-06-15T10:00:00.000Z'),
    notificationPreferences: [
      {
        discordEnabled: true,
        telegramEnabled: false,
        emailEnabled: true,
        alertTypes: ['critical'],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('returns profile with metadata', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.watchlist.count as jest.Mock).mockResolvedValue(3);
      (prisma.alert.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getProfile('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        createdAt: '2026-06-15T10:00:00.000Z',
        metadata: {
          watchlistCount: 3,
          openAlertsCount: 2,
          notificationPreferences: {
            discordEnabled: true,
            telegramEnabled: false,
            emailEnabled: true,
            alertTypes: ['critical'],
          },
        },
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates email and returns profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      });
      (prisma.watchlist.count as jest.Mock).mockResolvedValue(1);
      (prisma.alert.count as jest.Mock).mockResolvedValue(0);

      const result = await service.updateProfile('user-1', { email: 'new@example.com' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'new@example.com' },
        include: {
          notificationPreferences: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result.email).toBe('new@example.com');
    });

    it('throws BadRequestException for invalid email', async () => {
      await expect(service.updateProfile('user-1', { email: 'not-an-email' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when email is missing', async () => {
      await expect(service.updateProfile('user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProfile('missing', { email: 'a@b.com' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on duplicate email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockRejectedValue({ code: 'P2002' });

      await expect(service.updateProfile('user-1', { email: 'taken@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

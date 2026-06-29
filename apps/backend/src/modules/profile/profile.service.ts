import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfile } from './interfaces/profile.interface';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class ProfileService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreferences: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const [watchlistCount, openAlertsCount] = await Promise.all([
      this.prisma.watchlist.count({ where: { userId } }),
      this.prisma.alert.count({ where: { userId, status: 'open' } }),
    ]);

    return this.toUserProfile(user, watchlistCount, openAlertsCount);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const email = dto.email?.trim();

    if (!email) {
      throw new BadRequestException('email is required');
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('email format is invalid');
    }

    const existing = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { email },
        include: {
          notificationPreferences: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const [watchlistCount, openAlertsCount] = await Promise.all([
        this.prisma.watchlist.count({ where: { userId } }),
        this.prisma.alert.count({ where: { userId, status: 'open' } }),
      ]);

      return this.toUserProfile(user, watchlistCount, openAlertsCount);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already in use');
      }
      throw error;
    }
  }

  private toUserProfile(
    user: {
      id: string;
      email: string;
      createdAt: Date;
      notificationPreferences: Array<{
        discordEnabled: boolean;
        telegramEnabled: boolean;
        emailEnabled: boolean;
        alertTypes: string[];
      }>;
    },
    watchlistCount: number,
    openAlertsCount: number,
  ): UserProfile {
    const prefs = user.notificationPreferences[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      metadata: {
        watchlistCount,
        openAlertsCount,
        notificationPreferences: prefs
          ? {
              discordEnabled: prefs.discordEnabled,
              telegramEnabled: prefs.telegramEnabled,
              emailEnabled: prefs.emailEnabled,
              alertTypes: prefs.alertTypes,
            }
          : null,
      },
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}

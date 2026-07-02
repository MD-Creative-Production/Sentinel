import { Body, Controller, Get, Headers, Patch, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfile } from './interfaces/profile.interface';

/**
 * User profile endpoints.
 *
 * GET  /api/profile — read profile and account metadata
 * PATCH /api/profile — update editable profile fields
 *
 * Auth: temporary `X-User-Id` header until login/JWT issues (#78, #80) land.
 */
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Headers('x-user-id') userId?: string): Promise<UserProfile> {
    const resolvedUserId = this.resolveUserId(userId);
    return this.profileService.getProfile(resolvedUserId);
  }

  @Patch()
  updateProfile(
    @Headers('x-user-id') userId: string | undefined,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const resolvedUserId = this.resolveUserId(userId);
    return this.profileService.updateProfile(resolvedUserId, dto);
  }

  private resolveUserId(userId?: string): string {
    const trimmed = userId?.trim();
    if (!trimmed) {
      throw new UnauthorizedException('X-User-Id header is required');
    }
    return trimmed;
  }
}

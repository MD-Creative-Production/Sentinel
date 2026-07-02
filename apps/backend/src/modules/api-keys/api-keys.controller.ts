import { Controller, Get, Post, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, ApiKeyResponseDto, ApiKeyUsageDto } from './dto/api-key.dto';

// NOTE: In production, add @UseGuards(AuthGuard) and extract userId from request
// For now, userId is passed as a path parameter for demo purposes

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post(':userId')
  async createApiKey(
    @Param('userId') userId: string,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto & { key: string }> {
    return this.apiKeysService.createApiKey(userId, dto);
  }

  @Get(':userId')
  async getApiKeys(@Param('userId') userId: string): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.getApiKeys(userId);
  }

  @Delete(':userId/:keyId')
  @HttpCode(204)
  async revokeApiKey(
    @Param('userId') userId: string,
    @Param('keyId') keyId: string,
  ): Promise<void> {
    return this.apiKeysService.revokeApiKey(userId, keyId);
  }

  @Get(':userId/:keyId/usage')
  async getApiKeyUsage(
    @Param('userId') userId: string,
    @Param('keyId') keyId: string,
  ): Promise<ApiKeyUsageDto> {
    return this.apiKeysService.getApiKeyUsage(userId, keyId);
  }
}

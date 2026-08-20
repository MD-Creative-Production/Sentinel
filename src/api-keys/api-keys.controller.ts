import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';

import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
@UseGuards()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@Req() request: any, @Body() dto: CreateApiKeyDto) {
    const userId = request.user?.id ?? request.user?.userId;

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    return this.apiKeysService.create(userId, dto.name, expiresAt);
  }

  @Get()
  async findAll(@Req() request: any) {
    const userId = request.user?.id ?? request.user?.userId;

    return this.apiKeysService.findAll(userId);
  }

  @Delete(':id')
  async revoke(@Req() request: any, @Param('id') id: string) {
    const userId = request.user?.id ?? request.user?.userId;

    return this.apiKeysService.revoke(userId, id);
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const user = await this.apiKeysService.validate(apiKey);

    request.user = user;

    return true;
  }

  private extractApiKey(request: Request): string | null {
    const header = request.headers['x-api-key'];

    if (Array.isArray(header)) {
      return header[0] ?? null;
    }

    return header ?? null;
  }
}

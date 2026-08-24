import { Request } from 'express';
import { IVersionResolverStrategy, ApiVersion } from './versionStrategy.interface';

export class HeaderVersionStrategy implements IVersionResolverStrategy {
  readonly name = 'HTTP_HEADER';

  resolve(req: Request): ApiVersion | null {
    const headerValue = req.headers['x-api-version'] || req.headers['accept-version'];

    if (!headerValue) return null;

    const normalized = Array.isArray(headerValue)
      ? headerValue[0].trim().toLowerCase()
      : headerValue.trim().toLowerCase();

    if (normalized === '1' || normalized === 'v1') return 'v1';
    if (normalized === '2' || normalized === 'v2') return 'v2';

    return null;
  }
}

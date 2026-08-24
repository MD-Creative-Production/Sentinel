import { Request } from 'express';
import { IVersionResolverStrategy, ApiVersion } from './versionStrategy.interface';

export class UriVersionStrategy implements IVersionResolverStrategy {
  readonly name = 'URI_PATH';

  resolve(req: Request): ApiVersion | null {
    const match = req.path.match(/^\/api\/(v[1-2])(\/|$)/);
    if (match && (match[1] === 'v1' || match[1] === 'v2')) {
      return match[1] as ApiVersion;
    }
    return null;
  }
}

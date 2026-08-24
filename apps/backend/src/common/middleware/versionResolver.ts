import { Request, Response, NextFunction } from 'express';
import { IVersionResolverStrategy, ApiVersion } from '../strategies/versionStrategy.interface';

// Extend Express Request types directly via module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    apiVersion?: ApiVersion;
    versionStrategyUsed?: string;
  }
}

export class VersionResolver {
  private strategies: IVersionResolverStrategy[];
  private defaultVersion: ApiVersion;

  constructor(strategies: IVersionResolverStrategy[], defaultVersion: ApiVersion = 'v1') {
    this.strategies = strategies;
    this.defaultVersion = defaultVersion;
  }

  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      let resolvedVersion: ApiVersion | null = null;
      let strategyUsed = 'FALLBACK_DEFAULT';

      for (const strategy of this.strategies) {
        const version = strategy.resolve(req);
        if (version) {
          resolvedVersion = version;
          strategyUsed = strategy.name;
          break;
        }
      }

      req.apiVersion = resolvedVersion || this.defaultVersion;
      req.versionStrategyUsed = strategyUsed;

      res.setHeader('X-Resolved-API-Version', req.apiVersion);
      next();
    };
  }
}

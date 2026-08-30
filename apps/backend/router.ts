import { Router, Request, Response } from 'express';
import { VersionResolver } from './src/common/middleware/versionResolver';
import { UriVersionStrategy } from './src/common/strategies/uriStrategy';
import { HeaderVersionStrategy } from './src/common/strategies/headerStrategy';
import { resourceRouterV1 } from './v1/routes/resourceRouter';
import { resourceRouterV2 } from './v2/routes/resourceRouter';

export const apiRouter = Router();

// Strategy-pattern order of precedence
const resolver = new VersionResolver(
  [new UriVersionStrategy(), new HeaderVersionStrategy()],
  'v1', // Global fallback default
);

apiRouter.use(resolver.getMiddleware());

// Static Version Prefix Routes
apiRouter.use('/v1/resources', resourceRouterV1);
apiRouter.use('/v2/resources', resourceRouterV2);

// Dynamic Resolver Route (Dispatches based on Header/Fallback resolution)
apiRouter.use('/resources', (req: Request, res: Response, next) => {
  if (req.apiVersion === 'v2') {
    return resourceRouterV2(req, res, next);
  }
  return resourceRouterV1(req, res, next);
});

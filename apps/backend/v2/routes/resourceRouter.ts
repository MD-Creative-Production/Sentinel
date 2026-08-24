import { Router } from 'express';
import { ResourceControllerV2 } from '../controllers/resourceController';

export const resourceRouterV2 = Router();
resourceRouterV2.get('/', ResourceControllerV2.getResources);

import { Router } from 'express';
import { ResourceControllerV1 } from '../controllers/resourceController';

export const resourceRouterV1 = Router();
resourceRouterV1.get('/', ResourceControllerV1.getResources);

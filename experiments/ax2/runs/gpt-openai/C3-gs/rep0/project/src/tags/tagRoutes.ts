import { Router } from 'express';
import { asyncHandler } from '../http/asyncHandler';
import { TagService } from './TagService';

export function createTagRouter(service: TagService): Router {
  const router = Router();
  router.get('/', asyncHandler(async (_request, response) => {
    response.json({ tags: await service.list() });
  }));
  return router;
}

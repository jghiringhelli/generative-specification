import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { TagService } from './TagService';

/** Creates the tags API route. */
export function createTagRouter(tags: TagService): Router {
  const router = Router();
  router.get('/', asyncHandler(async (_request, response) => {
    response.json({ tags: await tags.list() });
  }));
  return router;
}

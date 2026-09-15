import { Router } from 'express';
import type { TagService } from '../tags/TagService';

/** Creates the tags API router. */
export function createTagRouter(tags: TagService): Router {
  const router = Router();

  router.get('/', async (_request, response, next) => {
    try {
      response.json({ tags: await tags.list() });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

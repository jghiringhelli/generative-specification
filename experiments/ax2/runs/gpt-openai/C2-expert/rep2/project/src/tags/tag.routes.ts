import { NextFunction, Request, Response, Router } from 'express';
import { TagService } from './tag.service';

/** Creates tag routes. */
export function createTagRouter(service: TagService): Router {
  const router = Router();
  router.get('/tags', async (_request: Request, response: Response, next: NextFunction) => {
    try {
      response.json({ tags: await service.list() });
    } catch (error) {
      next(error);
    }
  });
  return router;
}

import { Router } from 'express';
import { TagService } from './tag.service';

/**
 * Builds the tags router. Thin driving adapter: delegation only.
 * @param service injected {@link TagService}
 * @returns configured Express router
 */
export function createTagRouter(service: TagService): Router {
  const router = Router();

  router.get('/tags', async (_req, res, next) => {
    try {
      res.status(200).json(await service.list());
    } catch (error) {
      next(error);
    }
  });

  return router;
}

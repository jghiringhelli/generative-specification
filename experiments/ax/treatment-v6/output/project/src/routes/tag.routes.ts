import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { TagService } from '../services/TagService.js';

/**
 * Creates and returns the tags router.
 * Routes: GET /api/tags
 * @param tagService - Injected tag service.
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  /** GET /api/tags — list all tags */
  router.get('/tags', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await tagService.getTags();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

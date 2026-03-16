
/**
 * Tag route handlers.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';

export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags — Get all tags
   */
  router.get('/tags', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await tagService.getAllTags();

      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

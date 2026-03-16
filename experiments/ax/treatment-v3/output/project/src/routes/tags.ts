import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from '../services/TagService';

/**
 * Tag routes.
 * Thin layer: call service, format response.
 */
export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags - Get all tags
   */
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await tagService.getAllTags();

      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

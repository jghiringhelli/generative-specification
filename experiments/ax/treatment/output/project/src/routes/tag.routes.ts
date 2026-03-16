import { Router, Request, Response } from 'express';
import { TagService } from '../services/tag.service';

/**
 * Create tag routes.
 */
export function createTagRoutes(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags - Get all tags
   */
  router.get('/tags', async (req: Request, res: Response, next) => {
    try {
      const result = await tagService.getTags();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

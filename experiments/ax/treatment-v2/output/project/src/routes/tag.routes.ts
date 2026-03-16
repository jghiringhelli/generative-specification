import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';

export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  /**
   * GET /api/tags - Get all tags
   * No auth required
   */
  router.get('/tags', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await tagService.getTags();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

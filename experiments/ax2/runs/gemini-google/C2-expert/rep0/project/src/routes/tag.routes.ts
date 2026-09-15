import { Router, Request, Response, NextFunction } from 'express';
import { ITagService, TagService } from '../services/tag.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * Creates tags router.
 *
 * @param {ITagService} [tagService] - Tag service instance
 * @returns {Router} Configured Express router
 */
export function createTagRouter(tagService: ITagService = new TagService()): Router {
  const router = Router();

  // GET /api/tags
  router.get(
    '/tags',
    async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await tagService.getTags();
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

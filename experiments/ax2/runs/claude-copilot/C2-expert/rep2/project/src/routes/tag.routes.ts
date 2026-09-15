import { Router } from 'express';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../middleware/async-handler';

/**
 * Builds the tags router.
 * @param tagService the injected tag service.
 * @returns an Express router.
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  router.get(
    '/tags',
    asyncHandler(async (_req, res) => {
      const tags = await tagService.list();
      res.status(200).json({ tags });
    })
  );

  return router;
}

import { Router } from 'express';
import type { TagService } from '../services/TagService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Factory that constructs the tags router with injected service dependency.
 *
 * Routes:
 *   GET /tags — retrieve all unique tags across published articles
 *
 * @param tagService - Injected tag business-logic service
 * @returns Configured Express Router
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  // GET /api/tags — no auth required
  router.get(
    '/tags',
    asyncHandler(async (_req, res) => {
      const tags = await tagService.getAllTags();
      res.status(200).json({ tags });
    }),
  );

  return router;
}

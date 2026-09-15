import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { TagService } from '../services/tag.service';

/**
 * Builds the router for the tags endpoint.
 * @param tagService The tag service to delegate to.
 * @returns The configured Express router.
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  router.get(
    '/',
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const tags = await tagService.listTags();
        res.status(200).json({ tags });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

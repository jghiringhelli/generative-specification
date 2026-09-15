import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from './tag.service';

export function createTagsRouter(tagService: TagService = new TagService()): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await tagService.getTags();
      res.status(200).json({ tags });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

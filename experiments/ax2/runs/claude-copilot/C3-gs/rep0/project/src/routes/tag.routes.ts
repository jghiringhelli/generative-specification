import { Request, Response, Router } from 'express';
import { TagService } from '../services/TagService';

/**
 * Build the router for tag endpoints.
 * @param tagService - Tag service.
 * @returns The configured router.
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  router.get('/tags', async (_req: Request, res: Response) => {
    const result = await tagService.list();
    res.status(200).json(result);
  });

  return router;
}

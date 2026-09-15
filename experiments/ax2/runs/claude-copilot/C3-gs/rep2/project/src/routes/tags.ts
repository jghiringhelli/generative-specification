import { Router } from 'express';
import { TagService } from '../services/TagService';

/**
 * Build the router for tag endpoints.
 * @param tagService - The tag service.
 * @returns The configured router.
 */
export function createTagRouter(tagService: TagService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const tags = await tagService.list();
    res.status(200).json({ tags });
  });

  return router;
}

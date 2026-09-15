import { Request, Response, Router } from 'express';
import { TagService } from '../services/TagService';

/**
 * Build the tags router (driving adapter) delegating to {@link TagService}.
 * @param tags the tag service.
 */
export function buildTagRouter(tags: TagService): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    res.status(200).json(await tags.listTags());
  });

  return router;
}

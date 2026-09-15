import { Router } from 'express';
import { TagService } from './TagService';

/** Creates the public tag route. */
export function createTagRouter(service: TagService): Router {
  const router = Router();
  router.get('/tags', async (_request, response) => {
    response.json({ tags: await service.list() });
  });
  return router;
}

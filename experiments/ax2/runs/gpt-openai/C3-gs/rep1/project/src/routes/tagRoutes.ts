import { Router } from 'express';
import type { TagController } from '../controllers/TagController';

export function createTagRouter(controller: TagController): Router {
  const router = Router();
  router.get('/tags', controller.list);
  return router;
}

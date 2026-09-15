import { Router } from 'express';
import { TagController } from '../controllers/TagController';

export function createTagRouter(tagController: TagController): Router {
  const router = Router();

  router.get('/tags', (req, res, next) => tagController.getTags(req, res, next));

  return router;
}

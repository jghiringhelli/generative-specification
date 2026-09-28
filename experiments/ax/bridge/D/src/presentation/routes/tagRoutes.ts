import { Router } from 'express';
import { TagController } from '../controllers/TagController';

export const createTagRoutes = (tagController: TagController): Router => {
  const router = Router();

  router.get('/tags', tagController.getTags);

  return router;
};

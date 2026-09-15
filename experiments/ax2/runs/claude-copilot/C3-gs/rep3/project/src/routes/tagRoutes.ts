import { Router } from 'express';
import { TagController } from '../controllers/TagController';

/** Wire the tag route to the tag controller. */
export function tagRoutes(controller: TagController): Router {
  const router = Router();
  router.get('/', controller.list);
  return router;
}

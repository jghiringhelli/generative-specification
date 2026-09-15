import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';

/**
 * Creates and configures routes for tag queries.
 */
export function createTagRouter(controller: TagController = new TagController()): Router {
  const router = Router();

  router.get('/tags', controller.getTags);

  return router;
}

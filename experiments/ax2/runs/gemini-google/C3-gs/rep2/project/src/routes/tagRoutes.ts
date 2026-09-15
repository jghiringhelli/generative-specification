import { Router } from 'express';
import { TagController } from '../controllers/TagController';

/**
 * Creates and configures the tags router.
 * @param tagController The controller handling tag retrieval.
 * @returns Configured Express Router.
 */
export function createTagRouter(tagController: TagController): Router {
  const router = Router();

  router.get('/tags', tagController.getTags);

  return router;
}

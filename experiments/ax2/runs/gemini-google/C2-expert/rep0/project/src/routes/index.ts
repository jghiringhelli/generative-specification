import { Router } from 'express';
import { createUserRouter } from './user.routes';
import { createProfileRouter } from './profile.routes';
import { createArticleRouter } from './article.routes';
import { createCommentRouter } from './comment.routes';
import { createTagRouter } from './tag.routes';

/**
 * Combines all API route modules into a single root router.
 *
 * @returns {Router} Root API router
 */
export function createApiRouter(): Router {
  const router = Router();
  router.use(createUserRouter());
  router.use(createProfileRouter());
  router.use(createArticleRouter());
  router.use(createCommentRouter());
  router.use(createTagRouter());
  return router;
}





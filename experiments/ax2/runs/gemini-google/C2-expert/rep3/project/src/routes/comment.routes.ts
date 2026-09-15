import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createCommentSchema } from '../validators/comment.validator';

/**
 * Creates and configures routes for comment operations.
 */
export function createCommentRouter(
  controller: CommentController = new CommentController()
): Router {
  const router = Router();

  router.get('/articles/:slug/comments', optionalAuth, controller.getComments);
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    validateBody(createCommentSchema),
    controller.addComment
  );
  router.delete('/articles/:slug/comments/:id', requireAuth, controller.deleteComment);

  return router;
}

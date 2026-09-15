import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { requireAuth, optionalAuth } from '../middleware/auth';

/**
 * Creates and configures the comments router.
 * @param commentController The controller handling comment operations.
 * @returns Configured Express Router.
 */
export function createCommentRouter(commentController: CommentController): Router {
  const router = Router();

  router.get('/articles/:slug/comments', optionalAuth, commentController.getComments);
  router.post('/articles/:slug/comments', requireAuth, commentController.createComment);
  router.delete('/articles/:slug/comments/:id', requireAuth, commentController.deleteComment);

  return router;
}

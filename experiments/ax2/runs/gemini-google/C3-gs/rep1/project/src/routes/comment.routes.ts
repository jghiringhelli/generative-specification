import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';

export function createCommentRouter(commentController: CommentController): Router {
  const router = Router();

  router.get('/articles/:slug/comments', optionalAuth, commentController.getComments);
  router.post('/articles/:slug/comments', requireAuth, commentController.createComment);
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    commentController.deleteComment
  );

  return router;
}

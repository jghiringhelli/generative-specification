import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export const createCommentRoutes = (
  commentController: CommentController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  router.get('/articles/:slug/comments', authMiddleware.optionalAuthenticate, commentController.getComments);
  router.post('/articles/:slug/comments', authMiddleware.authenticate, commentController.addComment);
  router.delete('/articles/:slug/comments/:id', authMiddleware.authenticate, commentController.deleteComment);

  return router;
};

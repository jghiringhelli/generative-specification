// src/routes/commentRoutes.ts
import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export function createCommentRouter(commentController: CommentController): Router {
  const router = Router();

  router.get('/articles/:slug/comments', optionalAuth, commentController.getComments);
  router.post('/articles/:slug/comments', requireAuth, commentController.addComment);
  router.delete('/articles/:slug/comments/:id', requireAuth, commentController.deleteComment);

  return router;
}

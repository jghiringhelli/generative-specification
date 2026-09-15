import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { authOptional, authRequired } from '../middleware/auth';

export function createCommentRouter(commentController: CommentController): Router {
  const router = Router();

  router.get('/articles/:slug/comments', authOptional, (req, res, next) =>
    commentController.getComments(req, res, next)
  );

  router.post('/articles/:slug/comments', authRequired, (req, res, next) =>
    commentController.createComment(req, res, next)
  );

  router.delete('/articles/:slug/comments/:id', authRequired, (req, res, next) =>
    commentController.deleteComment(req, res, next)
  );

  return router;
}

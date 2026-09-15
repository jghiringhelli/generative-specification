import { Router } from 'express';
import { body, param } from 'express-validator';
import type { ITokenService } from '../auth/ITokenService';
import type { CommentController } from '../controllers/CommentController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export function createCommentRouter(controller: CommentController, tokens: ITokenService): Router {
  const router = Router();
  router.get('/articles/:slug/comments', optionalAuth(tokens), [param('slug').notEmpty(), validate], controller.list);
  router.post('/articles/:slug/comments', requireAuth(tokens), [
    param('slug').notEmpty(),
    body('comment.body').isString().trim().notEmpty(),
    validate,
  ], controller.create);
  router.delete('/articles/:slug/comments/:id', requireAuth(tokens), [
    param('slug').notEmpty(),
    param('id').notEmpty(),
    validate,
  ], controller.delete);
  return router;
}

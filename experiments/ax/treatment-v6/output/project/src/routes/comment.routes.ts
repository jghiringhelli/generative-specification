import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { CommentService } from '../services/CommentService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

/**
 * Creates and returns the comments router.
 * Routes: GET/POST /api/articles/:slug/comments, DELETE /api/articles/:slug/comments/:id
 * @param commentService - Injected comment service.
 */
export function createCommentRouter(commentService: CommentService): Router {
  const router = Router();

  /** GET /api/articles/:slug/comments — get all comments for an article */
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await commentService.getComments(req.params['slug']!, req.userId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** POST /api/articles/:slug/comments — add a comment to an article */
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await commentService.addComment(
          req.params['slug']!,
          req.userId!,
          req.body.comment,
        );
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /** DELETE /api/articles/:slug/comments/:id — delete a comment */
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await commentService.deleteComment(Number(req.params['id']), req.userId!);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

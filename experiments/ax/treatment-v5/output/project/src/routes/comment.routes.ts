
/**
 * Comment route handlers.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { createCommentSchema } from '../validators/comment.validator';
import { ValidationError } from '../errors/AppError';

export function createCommentRoutes(commentService: CommentService): Router {
  const router = Router();

  /**
   * GET /api/articles/:slug/comments — Get comments (auth optional)
   */
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId ?? null;

        const comments = await commentService.getCommentsByArticleSlug(slug, currentUserId);

        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/comments — Add comment (auth required)
   */
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parseResult = createCommentSchema.safeParse(req.body);
        if (!parseResult.success) {
          const firstError = parseResult.error.errors[0];
          throw new ValidationError(firstError.message);
        }

        const { slug } = req.params;
        const currentUserId = req.user!.userId;
        const { body } = parseResult.data.comment;

        const comment = await commentService.addComment(slug, body, currentUserId);

        res.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/comments/:id — Delete comment (auth required)
   */
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const currentUserId = req.user!.userId;

        await commentService.deleteComment(parseInt(id, 10), currentUserId);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

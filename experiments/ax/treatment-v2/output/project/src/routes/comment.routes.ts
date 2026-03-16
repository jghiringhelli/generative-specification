import { Router, Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateCommentRequestSchema } from '../types/comment.types';

export function createCommentRouter(commentService: CommentService): Router {
  const router = Router();

  /**
   * GET /api/articles/:slug/comments - Get all comments for an article
   * Auth optional
   */
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId;

        const result = await commentService.getComments(slug, currentUserId);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/comments - Add comment to article
   * Auth required
   */
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    validateBody(CreateCommentRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const { body } = req.body.comment;
        const authorId = req.user!.userId;

        const result = await commentService.addComment(slug, body, authorId);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/comments/:id - Delete comment
   * Auth required, author only
   */
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user!.userId;

        await commentService.deleteComment(parseInt(id, 10), userId);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

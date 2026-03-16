import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CommentService } from '../services/comment.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

// Validation schema
const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'Comment body cannot be empty')
  })
});

/**
 * Comment routes factory.
 */
export function createCommentRoutes(commentService: CommentService): Router {
  const router = Router();

  /**
   * GET /api/articles/:slug/comments - Get all comments for article
   * Auth optional
   */
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.id;

        const comments = await commentService.getComments(slug, currentUserId);

        res.status(200).json({ comments });
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
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const result = createCommentSchema.safeParse(req.body);

        if (!result.success) {
          const firstError = result.error.errors[0];
          throw new ValidationError(firstError.message);
        }

        const comment = await commentService.addComment(
          slug,
          result.data.comment,
          req.user!.id
        );

        res.status(200).json({ comment });
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
        const commentId = parseInt(req.params.id, 10);

        if (isNaN(commentId)) {
          throw new ValidationError('Invalid comment ID');
        }

        await commentService.deleteComment(commentId, req.user!.id);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

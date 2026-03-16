import { Router, Response } from 'express';
import { CommentService } from '../services/comment.service';
import { AuthService } from '../services/auth.service';
import {
  AuthenticatedRequest,
  createAuthMiddleware,
  createOptionalAuthMiddleware
} from '../middleware/auth.middleware';
import { ValidationError } from '../errors';
import { createCommentSchema } from '../validation/comment.schemas';

/**
 * Create comment routes.
 */
export function createCommentRoutes(
  commentService: CommentService,
  authService: AuthService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);
  const optionalAuth = createOptionalAuthMiddleware(authService);

  /**
   * GET /api/articles/:slug/comments - Get comments for article
   */
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { slug } = req.params;
        const result = await commentService.getComments(slug, req.userId);

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/comments - Add comment to article
   */
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const result = createCommentSchema.safeParse(req.body);

        if (!result.success) {
          const firstError = result.error.errors[0];
          throw new ValidationError(firstError.message);
        }

        const { slug } = req.params;
        const comment = await commentService.addComment(
          slug,
          result.data.comment,
          req.userId!
        );

        res.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/comments/:id - Delete comment
   */
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { slug, id } = req.params;
        const commentId = parseInt(id, 10);

        if (isNaN(commentId)) {
          throw new ValidationError('Invalid comment ID');
        }

        await commentService.deleteComment(slug, commentId, req.userId!);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

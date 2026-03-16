import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CommentService } from '../services/CommentService';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

/**
 * Comment routes (nested under /api/articles/:slug).
 * Thin layer: parse input, call service, format response.
 */
export function createCommentRoutes(commentService: CommentService): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :slug from parent

  /**
   * GET /api/articles/:slug/comments - List comments (auth optional)
   */
  router.get(
    '/',
    optionalAuthenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { slug } = req.params;
        const currentUserId = req.user?.userId;

        const comments = await commentService.getComments(slug, currentUserId);

        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/articles/:slug/comments - Add comment (auth required)
   */
  router.post(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug } = req.params;

        const schema = z.object({
          comment: z.object({
            body: z.string().min(1, 'Comment body cannot be empty')
          })
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')} ${e.message}`);
          throw new ValidationError(errors.join(', '));
        }

        const comment = await commentService.addComment(
          slug,
          parsed.data.comment,
          req.user.userId
        );

        res.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/articles/:slug/comments/:id - Delete comment (auth required, author only)
   */
  router.delete(
    '/:id',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new Error('User not attached by auth middleware');
        }

        const { slug, id } = req.params;
        const commentId = parseInt(id, 10);

        if (isNaN(commentId)) {
          throw new ValidationError('Invalid comment ID');
        }

        await commentService.deleteComment(slug, commentId, req.user.userId);

        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

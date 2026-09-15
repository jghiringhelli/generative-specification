import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ICommentService, CommentService } from '../services/comment.service';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { HTTP_STATUS } from '../config/constants';
import { UnauthorizedError, ValidationError } from '../utils/error.util';

const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'Body is required')
  })
});

/**
 * Creates comment management router.
 */
export function createCommentRouter(
  commentService: ICommentService = new CommentService()
): Router {
  const router = Router();

  // GET /api/articles/:slug/comments
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const slug = req.params.slug;
        const result = await commentService.getComments(slug, req.user?.id);
        res.status(HTTP_STATUS.OK).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/articles/:slug/comments
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    validateBody(createCommentSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const slug = req.params.slug;
        const result = await commentService.addComment(slug, req.user.id, req.body.comment);
        res.status(HTTP_STATUS.CREATED).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/articles/:slug/comments/:id
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }
        const slug = req.params.slug;
        const commentId = Number(req.params.id);
        if (!Number.isInteger(commentId) || commentId <= 0) {
          throw new ValidationError('Comment ID must be a positive integer');
        }
        await commentService.deleteComment(slug, commentId, req.user.id);
        res.status(HTTP_STATUS.OK).json({ message: 'Comment deleted successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

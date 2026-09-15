import { Router, Response, NextFunction } from 'express';
import {
  CommentService,
  AddCommentInputSchema,
} from '../services/comment-service';
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from '../middleware/auth';
import { UnauthorizedError, ValidationError } from '../errors/http-error';

const router = Router();
const commentService = new CommentService();

/**
 * GET /api/articles/:slug/comments - List comments for an article
 */
router.get(
  '/articles/:slug/comments',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const comments = await commentService.getComments(slug, req.user?.userId);
      res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/articles/:slug/comments - Add a comment to an article
 */
router.post(
  '/articles/:slug/comments',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { slug } = req.params;
      const validatedInput = AddCommentInputSchema.parse(req.body);
      const comment = await commentService.addComment(slug, validatedInput, req.user.userId);
      res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/articles/:slug/comments/:id - Delete a comment
 */
router.delete(
  '/articles/:slug/comments/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError();
      }
      const { slug, id } = req.params;
      const commentId = parseInt(id, 10);
      if (Number.isNaN(commentId)) {
        throw new ValidationError('Invalid comment ID parameter');
      }

      await commentService.deleteComment(slug, commentId, req.user.userId);
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export const commentRouter = router;

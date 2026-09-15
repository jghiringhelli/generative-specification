import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { commentService } from '../services/comment.service';
import { RequestWithUser } from '../types';
import { ValidationError } from '../lib/errors';

const router = Router();

const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'is required')
  })
});

/**
 * GET /api/articles/:slug/comments - Get all comments for an article
 */
router.get(
  '/articles/:slug/comments',
  optionalAuth,
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await commentService.getComments(req.params.slug, req.userId);
      res.status(200).json(result);
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
  validateBody(createCommentSchema),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await commentService.addComment(
        req.params.slug,
        req.userId!,
        req.body.comment.body
      );
      res.status(200).json(result);
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
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const commentId = parseInt(req.params.id, 10);
      if (isNaN(commentId)) {
        throw new ValidationError('Comment ID must be a valid number');
      }

      await commentService.deleteComment(req.params.slug, commentId, req.userId!);
      res.status(200).json({});
    } catch (error) {
      next(error);
    }
  }
);

export default router;

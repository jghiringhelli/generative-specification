import { Router } from 'express';
import { z } from 'zod';
import type { CommentService } from '../services/CommentService';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { zodToValidationError } from '../utils/zodError';
import { NotFoundError } from '../errors/AppError';

// =============================================================================
// Zod schemas
// =============================================================================

const CreateCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});

// =============================================================================
// Router factory
// =============================================================================

/**
 * Factory that constructs the comments router with injected service dependency.
 *
 * Routes:
 *   GET    /articles/:slug/comments          — list comments (auth optional)
 *   POST   /articles/:slug/comments          — add comment (auth required)
 *   DELETE /articles/:slug/comments/:id      — delete comment (auth required, author only)
 *
 * @param commentService - Injected comment business-logic service
 * @returns Configured Express Router
 */
export function createCommentRouter(commentService: CommentService): Router {
  const router = Router();

  // GET /api/articles/:slug/comments — list all comments for an article
  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    asyncHandler(async (req, res) => {
      const comments = await commentService.getComments(req.params.slug, req.userId);
      res.status(200).json({ comments });
    }),
  );

  // POST /api/articles/:slug/comments — add a comment (auth required)
  router.post(
    '/articles/:slug/comments',
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = CreateCommentSchema.safeParse(req.body);
      if (!parsed.success) throw zodToValidationError(parsed.error);
      const comment = await commentService.addComment(
        req.userId!,
        req.params.slug,
        parsed.data.comment.body,
      );
      res.status(201).json({ comment });
    }),
  );

  // DELETE /api/articles/:slug/comments/:id — delete a comment (auth required, author only)
  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const commentId = parseInt(req.params.id, 10);
      if (!Number.isInteger(commentId) || commentId <= 0) {
        throw new NotFoundError('comment');
      }
      await commentService.deleteComment(req.userId!, req.params.slug, commentId);
      res.status(204).send();
    }),
  );

  return router;
}

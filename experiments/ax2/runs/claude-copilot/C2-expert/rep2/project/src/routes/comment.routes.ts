import { Router } from 'express';
import { CommentService } from '../services/comment.service';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { ValidationError } from '../utils/errors';
import { createCommentSchema } from '../validators/comment.schemas';

function parseCommentId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 0) {
    throw new ValidationError(['comment id must be a positive integer']);
  }
  return id;
}

/**
 * Builds the comments router, mounted under `/articles/:slug/comments`.
 * @param commentService the injected comment service.
 * @returns an Express router.
 */
export function createCommentRouter(commentService: CommentService): Router {
  const router = Router();

  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const comments = await commentService.list(req.params.slug, req.user?.id);
      res.status(200).json({ comments });
    })
  );

  router.post(
    '/articles/:slug/comments',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const { comment } = createCommentSchema.parse(req.body);
      const created = await commentService.add(req.params.slug, comment, req.user!.id);
      res.status(201).json({ comment: created });
    })
  );

  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const commentId = parseCommentId(req.params.id);
      await commentService.delete(req.params.slug, commentId, req.user!.id);
      res.status(200).json({});
    })
  );

  return router;
}

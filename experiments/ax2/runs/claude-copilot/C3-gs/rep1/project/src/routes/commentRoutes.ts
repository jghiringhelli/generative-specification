import { Router } from 'express';
import { Container } from '../container';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';
import { requireUserId } from '../controllers/requestHelpers';

/**
 * Build the router for article comment endpoints.
 *
 * Mounted with `mergeParams` so the parent `:slug` is available.
 * @param container - Wired application services.
 * @returns An Express router mounted under /api/articles/:slug/comments.
 */
export function createCommentRouter(container: Container): Router {
  const router = Router({ mergeParams: true });
  const { commentService } = container;

  router.get('/', optionalAuth, async (req, res) => {
    const comments = await commentService.list(req.params.slug, req.userId);
    res.status(200).json({ comments });
  });

  router.post('/', requireAuth, async (req, res) => {
    const comment = await commentService.create(req.params.slug, requireUserId(req), req.body);
    res.status(201).json({ comment });
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const commentId = Number(req.params.id);
    if (!Number.isInteger(commentId)) {
      throw new ValidationError({ id: ['must be an integer'] });
    }
    await commentService.delete(req.params.slug, commentId, requireUserId(req));
    res.status(200).json({});
  });

  return router;
}

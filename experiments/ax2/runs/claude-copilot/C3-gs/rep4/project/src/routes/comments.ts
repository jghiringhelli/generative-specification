import { Request, Response, Router } from 'express';
import { CommentService } from '../services/CommentService';
import { ITokenService } from '../services/ports/ITokenService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { requireUserId } from './helpers';
import { addCommentSchema, parseOrThrow } from '../validation/schemas';
import { ValidationError } from '../errors/AppError';

/**
 * Build the comments router (driving adapter) delegating to {@link CommentService}.
 * Mounted alongside the articles router under `/api/articles`.
 * @param comments the comment service.
 * @param tokens the token service used by auth middleware.
 */
export function buildCommentRouter(comments: CommentService, tokens: ITokenService): Router {
  const router = Router();

  router.get(
    '/:slug/comments',
    optionalAuth(tokens),
    async (req: Request, res: Response) => {
      const envelope = await comments.listComments(req.params.slug, req.userId ?? null);
      res.status(200).json(envelope);
    },
  );

  router.post(
    '/:slug/comments',
    requireAuth(tokens),
    async (req: Request, res: Response) => {
      const { comment } = parseOrThrow(addCommentSchema, req.body);
      const view = await comments.addComment(req.params.slug, requireUserId(req), comment);
      res.status(201).json({ comment: view });
    },
  );

  router.delete(
    '/:slug/comments/:id',
    requireAuth(tokens),
    async (req: Request, res: Response) => {
      const commentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(commentId)) {
        throw new ValidationError('invalid comment id', { id: ['must be a number'] });
      }
      await comments.deleteComment(req.params.slug, commentId, requireUserId(req));
      res.status(200).json({});
    },
  );

  return router;
}

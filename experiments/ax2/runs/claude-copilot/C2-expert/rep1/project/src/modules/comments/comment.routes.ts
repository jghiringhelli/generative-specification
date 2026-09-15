import { Router, Response, NextFunction } from 'express';
import { CommentService } from './comment.service';
import { createCommentSchema } from './comment.schemas';
import { parseOrThrow } from '../../lib/validation';
import { ValidationError } from '../../lib/errors';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

/**
 * Builds the comments router. Thin driving adapter: validation + delegation.
 * @param service injected {@link CommentService}
 * @returns configured Express router
 */
export function createCommentRouter(service: CommentService): Router {
  const router = Router();

  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        res.status(200).json(await service.list(req.params.slug, req.user?.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/articles/:slug/comments',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const input = parseOrThrow(createCommentSchema, req.body).comment;
        res.status(201).json(await service.add(req.params.slug, input.body, req.user!.id));
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const commentId = Number(req.params.id);
        if (!Number.isInteger(commentId) || commentId < 0) {
          throw new ValidationError(['id must be a positive integer']);
        }
        await service.delete(req.params.slug, commentId, req.user!.id);
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

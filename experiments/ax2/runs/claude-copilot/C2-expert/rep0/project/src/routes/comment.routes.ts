import { Router } from 'express';
import type { NextFunction, Response } from 'express';
import type { CommentService } from '../services/comment.service';
import { ValidationError } from '../errors';
import {
  optionalAuth,
  requireAuth,
  type AuthenticatedRequest
} from '../middleware/auth';

/**
 * Builds the router for article comment endpoints, mounted under
 * `/api/articles`.
 * @param commentService The comment service to delegate to.
 * @param jwtSecret The signing secret for the auth middleware.
 * @returns The configured Express router.
 */
export function createCommentRouter(
  commentService: CommentService,
  jwtSecret: string
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret);
  const maybeAuth = optionalAuth(jwtSecret);

  router.get(
    '/:slug/comments',
    maybeAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const comments = await commentService.listComments(
          req.params.slug,
          req.userId
        );
        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/:slug/comments',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const comment = await commentService.addComment(
          req.params.slug,
          req.body,
          req.userId as number
        );
        res.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:slug/comments/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const commentId = Number(req.params.id);
        if (!Number.isInteger(commentId) || commentId < 0) {
          throw new ValidationError(['comment id must be a valid integer']);
        }
        await commentService.deleteComment(
          req.params.slug,
          commentId,
          req.userId as number
        );
        res.status(200).json({});
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

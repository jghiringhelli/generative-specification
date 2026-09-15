import { Router } from 'express';
import { z } from 'zod';
import type { ITokenService } from '../auth/JwtTokenService';
import type { CommentService } from '../comments/CommentService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1),
  }),
});

/** Creates the comments API router. */
export function createCommentRouter(
  comments: CommentService,
  tokens: ITokenService,
): Router {
  const router = Router();

  router.get('/:slug/comments', optionalAuth(tokens), async (request, response, next) => {
    try {
      const results = await comments.list(request.params.slug, request.userId);
      response.json({ comments: results });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/:slug/comments',
    requireAuth(tokens),
    validateBody(createCommentSchema),
    async (request, response, next) => {
      try {
        const comment = await comments.create(
          request.params.slug,
          request.userId!,
          request.body.comment.body,
        );
        response.status(201).json({ comment });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:slug/comments/:id',
    requireAuth(tokens),
    async (request, response, next) => {
      try {
        await comments.delete(request.params.slug, request.params.id, request.userId!);
        response.sendStatus(204);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

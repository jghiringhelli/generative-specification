import { Router } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../errors/AppError';
import { AuthMiddleware } from '../middleware/auth';
import { CommentService } from './CommentService';

const createSchema = z.object({
  comment: z.object({ body: z.string().min(1) }),
});

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/** Creates article comment routes. */
export function createCommentRouter(
  service: CommentService,
  requireAuth: AuthMiddleware,
  optionalAuth: AuthMiddleware,
): Router {
  const router = Router();

  router.get(
    '/articles/:slug/comments',
    optionalAuth,
    async (request, response) => {
      response.json({
        comments: await service.list(
          request.params.slug,
          request.auth?.userId,
        ),
      });
    },
  );

  router.post(
    '/articles/:slug/comments',
    requireAuth,
    async (request, response) => {
      const { comment } = createSchema.parse(request.body);
      const created = await service.create(
        request.params.slug,
        requireUserId(request.auth?.userId),
        comment.body,
      );
      response.status(201).json({ comment: created });
    },
  );

  router.delete(
    '/articles/:slug/comments/:id',
    requireAuth,
    async (request, response) => {
      await service.delete(
        request.params.slug,
        request.params.id,
        requireUserId(request.auth?.userId),
      );
      response.status(204).send();
    },
  );

  return router;
}

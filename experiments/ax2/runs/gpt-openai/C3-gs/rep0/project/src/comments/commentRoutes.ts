import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/AuthService';
import { authentication } from '../http/auth';
import { asyncHandler } from '../http/asyncHandler';
import { AuthenticatedRequest, OptionalAuthRequest } from '../http/request';
import { validateBody } from '../http/validate';
import { CommentService } from './CommentService';

const commentSchema = z.object({
  comment: z.object({ body: z.string().trim().min(1) }),
});

export function createCommentRouter(service: CommentService, auth: AuthService): Router {
  const router = Router();
  const optionalAuth = authentication(auth, false);
  const requireAuth = authentication(auth, true);

  router.get('/:slug/comments', optionalAuth, asyncHandler(async (request, response) => {
    const comments = await service.list(
      request.params.slug!, (request as OptionalAuthRequest).userId,
    );
    response.json({ comments });
  }));
  router.post(
    '/:slug/comments',
    requireAuth,
    validateBody(commentSchema),
    asyncHandler(async (request, response) => {
      const userId = (request as AuthenticatedRequest).userId;
      const comment = await service.create(request.params.slug!, userId, request.body.comment.body);
      response.status(201).json({ comment });
    }),
  );
  router.delete('/:slug/comments/:id', requireAuth, asyncHandler(async (request, response) => {
    await service.delete(
      request.params.slug!, request.params.id!, (request as AuthenticatedRequest).userId,
    );
    response.sendStatus(204);
  }));
  return router;
}

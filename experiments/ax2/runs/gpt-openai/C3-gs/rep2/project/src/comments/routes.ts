import { Router } from 'express';
import { TokenService } from '../auth/ports';
import { UnauthorizedError } from '../errors/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { CommentService } from './CommentService';
import { createCommentSchema } from './validation';

function userId(value: string | undefined): string {
  if (!value) {
    throw new UnauthorizedError('Authentication is required');
  }
  return value;
}

/** Creates comment API routes nested beneath articles. */
export function createCommentRouter(comments: CommentService, tokens: TokenService): Router {
  const router = Router();

  router.get('/:slug/comments', optionalAuth(tokens), asyncHandler(async (request, response) => {
    response.json({
      comments: await comments.list(request.params.slug, request.userId),
    });
  }));

  router.post('/:slug/comments', requireAuth(tokens), asyncHandler(async (request, response) => {
    const { comment } = createCommentSchema.parse(request.body);
    response.status(201).json({
      comment: await comments.create(request.params.slug, comment.body, userId(request.userId)),
    });
  }));

  router.delete(
    '/:slug/comments/:id',
    requireAuth(tokens),
    asyncHandler(async (request, response) => {
      await comments.delete(request.params.slug, request.params.id, userId(request.userId));
      response.status(204).send();
    }),
  );

  return router;
}

import { NextFunction, Request, Response, Router } from 'express';
import { createAuthenticationMiddleware } from '../http/auth.middleware';
import { createOptionalAuthenticationMiddleware } from '../http/optional-auth.middleware';
import { AuthenticatedRequest } from '../http/request';
import { commentIdSchema, createCommentSchema } from './comment.schemas';
import { CommentService } from './comment.service';

/** Creates article comment routes. */
export function createCommentRouter(service: CommentService, jwtSecret: string): Router {
  const router = Router();
  const required = createAuthenticationMiddleware(jwtSecret);
  const optional = createOptionalAuthenticationMiddleware(jwtSecret);

  router.get('/articles/:slug/comments', optional, asyncHandler(async (request, response) => {
    const comments = await service.list(request.params.slug, optionalUserId(request));
    response.json({ comments });
  }));
  router.post('/articles/:slug/comments', required, asyncHandler(async (request, response) => {
    const { comment } = createCommentSchema.parse(request.body);
    const created = await service.create(request.params.slug, userId(request), comment.body);
    response.json({ comment: created });
  }));
  router.delete('/articles/:slug/comments/:id', required, asyncHandler(async (request, response) => {
    await service.delete(request.params.slug, commentIdSchema.parse(request.params.id), userId(request));
    response.sendStatus(200);
  }));
  return router;
}

function asyncHandler(operation: (request: Request, response: Response) => Promise<void>) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { await operation(request, response); } catch (error) { next(error); }
  };
}

function userId(request: Request): number {
  return (request as AuthenticatedRequest).userId;
}

function optionalUserId(request: Request): number | undefined {
  return (request as Partial<AuthenticatedRequest>).userId;
}

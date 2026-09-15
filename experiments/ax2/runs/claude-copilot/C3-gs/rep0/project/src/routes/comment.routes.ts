import { Request, Response, Router } from 'express';
import { CommentService } from '../services/CommentService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { IUserRepository } from '../repositories/IUserRepository';
import { UnauthorizedError, ValidationError } from '../errors/AppError';
import { UserEntity } from '../domain/types';

/**
 * Retrieve the authenticated user or throw.
 * @param req - The request.
 * @returns The authenticated user.
 */
function currentUser(req: Request): UserEntity {
  if (!req.user) {
    throw new UnauthorizedError('authorization required');
  }
  return req.user;
}

/**
 * Parse a numeric route parameter or throw a validation error.
 * @param raw - The raw parameter string.
 * @returns The parsed integer.
 */
function parseId(raw: string): number {
  const id = Number.parseInt(raw, 10);
  if (Number.isNaN(id)) {
    throw new ValidationError({ id: ['is invalid'] });
  }
  return id;
}

/**
 * Build the router for comment endpoints.
 * @param commentService - Comment service.
 * @param jwtSecret - JWT signing secret (for auth middleware).
 * @param userRepository - User lookup port (for auth middleware).
 * @returns The configured router.
 */
export function createCommentRouter(
  commentService: CommentService,
  jwtSecret: string,
  userRepository: IUserRepository
): Router {
  const router = Router();
  const auth = requireAuth(jwtSecret, userRepository);
  const maybeAuth = optionalAuth(jwtSecret, userRepository);

  router.get('/articles/:slug/comments', maybeAuth, async (req: Request, res: Response) => {
    const result = await commentService.listForArticle(req.params.slug, req.userId);
    res.status(200).json(result);
  });

  router.post('/articles/:slug/comments', auth, async (req: Request, res: Response) => {
    const result = await commentService.addComment(req.params.slug, req.body, currentUser(req));
    res.status(201).json(result);
  });

  router.delete('/articles/:slug/comments/:id', auth, async (req: Request, res: Response) => {
    await commentService.deleteComment(req.params.slug, parseId(req.params.id), currentUser(req));
    res.status(200).json({});
  });

  return router;
}

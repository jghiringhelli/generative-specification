import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ArticleForbiddenError, ArticleNotFoundError } from '../articles/article.errors';
import { CommentForbiddenError, CommentNotFoundError } from '../comments/comment.errors';
import { ProfileNotFoundError } from '../profiles/profile.errors';
import { UserNotFoundError, UserValidationError } from '../users/user.errors';

/** Converts application errors into HTTP responses. */
export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    response.status(422).json({ errors: { body: error.issues.map((issue) => issue.message) } });
    return;
  }
  if (error instanceof ArticleForbiddenError || error instanceof CommentForbiddenError) {
    response.status(403).json({ errors: { body: [error.message] } });
    return;
  }
  if (error instanceof UserValidationError || error instanceof Prisma.PrismaClientKnownRequestError) {
    response.status(422).json({ errors: { body: [error.message] } });
    return;
  }
  if (error instanceof UserNotFoundError || error instanceof ProfileNotFoundError || error instanceof ArticleNotFoundError || error instanceof CommentNotFoundError) {
    response.status(404).json({ errors: { body: [error.message] } });
    return;
  }
  response.status(500).json({ errors: { body: ['internal server error'] } });
}

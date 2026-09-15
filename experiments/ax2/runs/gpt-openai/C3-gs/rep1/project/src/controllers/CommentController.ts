import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { CommentService } from '../services/CommentService';

export class CommentController {
  public constructor(private readonly comments: CommentService) {}

  /** Lists comments for an article. */
  public list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json({ comments: await this.comments.list(request.params.slug, request.userId) });
    } catch (error) { next(error); }
  };

  /** Adds a comment to an article. */
  public create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const comment = await this.comments.create(request.params.slug, request.body.comment.body, this.userId(request));
      response.status(201).json({ comment });
    } catch (error) { next(error); }
  };

  /** Deletes an authored comment. */
  public delete = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await this.comments.delete(request.params.slug, request.params.id, this.userId(request));
      response.sendStatus(204);
    } catch (error) { next(error); }
  };

  private userId(request: Request): string {
    if (!request.userId) throw new UnauthorizedError();
    return request.userId;
  }
}

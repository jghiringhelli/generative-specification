/**
 * Thin HTTP adapter for the comment endpoints: validate input, read the
 * path/identity, delegate to {@link CommentService}, present the result. No
 * business logic (article resolution, ownership) lives here — that is the
 * service's job; this layer only translates between HTTP and the service.
 *
 * @gs-links: docs/specs/comments.md, docs/use-cases.md
 */
import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import type { CommentService } from '../services/CommentService.js';
import { toCommentListResponse, toCommentResponse } from './commentPresenter.js';
import { createCommentSchema } from './commentSchemas.js';
import { parseOrThrow } from './validation.js';

export class CommentController {
  constructor(private readonly service: CommentService) {}

  /** GET /api/articles/:slug/comments — public list (optional auth). */
  async list(req: Request, res: Response): Promise<void> {
    const comments = await this.service.listForArticle(slug(req), req.userId);
    res.status(200).json(toCommentListResponse(comments));
  }

  /** POST /api/articles/:slug/comments — add a comment (auth required). */
  async create(req: Request, res: Response): Promise<void> {
    const { comment } = parseOrThrow(createCommentSchema, req.body);
    const created = await this.service.add(slug(req), this.requireUserId(req), comment.body);
    res.status(201).json(toCommentResponse(created));
  }

  /** DELETE /api/articles/:slug/comments/:id — delete a comment (author only). */
  async remove(req: Request, res: Response): Promise<void> {
    await this.service.delete(slug(req), commentId(req), this.requireUserId(req));
    res.status(204).end();
  }

  /** Read the id attached by `authenticate`; defensive guard for type-narrowing. */
  private requireUserId(req: Request): string {
    if (req.userId === undefined) {
      throw new UnauthorizedError();
    }
    return req.userId;
  }
}

/**
 * Read the `:slug` path segment. The route always binds it; this narrows the
 * `string | undefined` index type and is a defensive 404 if it were absent.
 */
function slug(req: Request): string {
  const value = req.params.slug;
  if (value === undefined) {
    throw new NotFoundError('Article');
  }
  return value;
}

/**
 * Read the `:id` path segment as the integer comment id. A non-integer segment
 * can never match a stored id, so it is treated as a missing comment (404).
 */
function commentId(req: Request): number {
  const value = Number(req.params.id);
  if (!Number.isInteger(value)) {
    throw new NotFoundError('Comment');
  }
  return value;
}

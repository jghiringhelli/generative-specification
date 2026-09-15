import { Request, Response } from 'express';
import { CommentService } from '../services/CommentService';
import { parseOrThrow } from '../validators/parse';
import { createCommentSchema } from '../validators/articleSchemas';
import { ValidationError } from '../errors/AppError';

/** Thin driving adapter for comment endpoints. */
export class CommentController {
  constructor(private readonly comments: CommentService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.comments.list(
      req.params.slug,
      req.userId ?? null,
    );
    res.status(200).json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(createCommentSchema, req.body);
    const result = await this.comments.create(
      req.params.slug,
      input,
      req.userId as number,
    );
    res.status(201).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const commentId = Number(req.params.id);
    if (!Number.isInteger(commentId)) {
      throw new ValidationError({ id: ['is invalid'] });
    }
    await this.comments.delete(
      req.params.slug,
      commentId,
      req.userId as number,
    );
    res.status(200).json({});
  };
}

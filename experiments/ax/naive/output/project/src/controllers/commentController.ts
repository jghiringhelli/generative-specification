import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const addCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1)
  })
});

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const body = addCommentSchema.parse(req.body);
    const comment = await commentService.addComment(slug, req.userId!, body.comment.body);
    res.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const comments = await commentService.getComments(slug, req.userId);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, id } = req.params;
    await commentService.deleteComment(slug, parseInt(id), req.userId!);
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
}

import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1),
  }),
});

export const commentIdSchema = z.coerce.number().int().positive();

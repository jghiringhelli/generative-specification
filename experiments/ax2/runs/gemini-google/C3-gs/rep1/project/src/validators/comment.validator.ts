import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'comment body cannot be empty'),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['comment'];

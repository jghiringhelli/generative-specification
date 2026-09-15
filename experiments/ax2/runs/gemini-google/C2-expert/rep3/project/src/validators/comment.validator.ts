import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string({ required_error: 'body is required' }).min(1, 'body cannot be empty'),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['comment'];

import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'Body is required')
  })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

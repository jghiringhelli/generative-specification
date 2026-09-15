import { z } from 'zod';

/** Zod schema for creating a comment. */
export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, 'is required')
  })
});

/** Create-comment input DTO. */
export type CreateCommentInput = z.infer<typeof createCommentSchema>['comment'];

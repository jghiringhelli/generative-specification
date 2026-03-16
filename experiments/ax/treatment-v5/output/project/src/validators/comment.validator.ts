
/**
 * Input validation schemas for comment endpoints.
 */

import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z
      .string({
        required_error: "body can't be blank"
      })
      .min(1, { message: "body can't be blank" })
  })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

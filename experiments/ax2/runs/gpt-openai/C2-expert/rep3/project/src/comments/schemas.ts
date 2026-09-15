import { z } from 'zod';

export const commentInputSchema = z.object({
  comment: z.object({ body: z.string().min(1) }),
});

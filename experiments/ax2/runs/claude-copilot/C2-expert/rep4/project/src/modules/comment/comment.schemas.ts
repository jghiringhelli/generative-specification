import { z } from "zod";

/** Zod schema for adding a comment. */
export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1, "can't be blank"),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>["comment"];

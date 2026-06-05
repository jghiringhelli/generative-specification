/**
 * Request validation schema for the comment endpoints (Zod).
 *
 * Validation happens at the HTTP boundary (api.md): the body is parsed into a
 * typed DTO and any failure becomes a {@link ValidationError} carrying per-field
 * messages, rendered as a 422 RealWorld envelope. RealWorld wraps the payload in
 * a top-level `comment` object.
 *
 * @gs-links: docs/specs/comments.md
 */
import { z } from 'zod';

export const createCommentSchema = z.object({
  comment: z.object({
    body: z.string().trim().min(1, "can't be blank"),
  }),
});

export type CreateCommentBody = z.infer<typeof createCommentSchema>;

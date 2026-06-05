/**
 * Request validation schemas for the article endpoints (Zod).
 *
 * Validation happens at the HTTP boundary (api.md): bodies and query strings are
 * parsed into typed DTOs and any failure becomes a {@link ValidationError}
 * carrying per-field messages, rendered as a 422 RealWorld envelope. RealWorld
 * wraps article payloads in a top-level `article` object; list/feed filters and
 * pagination arrive as query-string params (always strings, hence `coerce`).
 *
 * @gs-links: docs/specs/articles.md
 */
import { z } from 'zod';

const requiredText = (): z.ZodString => z.string().trim().min(1, "can't be blank");

export const createArticleSchema = z.object({
  article: z.object({
    title: requiredText(),
    description: requiredText(),
    body: requiredText(),
    tagList: z.array(z.string()).optional().default([]),
  }),
});

export const updateArticleSchema = z.object({
  article: z
    .object({
      title: requiredText().optional(),
      description: requiredText().optional(),
      body: requiredText().optional(),
      // Present-but-`null` is rejected (422); an empty array clears all tags.
      tagList: z.array(z.string()).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field must be provided',
    }),
});

/** Bounded pagination: `limit` 1..100 (default 20), `offset` ≥ 0 (default 0). */
const limit = z.coerce.number().int().min(1).max(100).default(20);
const offset = z.coerce.number().int().min(0).default(0);

export const listArticlesQuerySchema = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit,
  offset,
});

export const feedQuerySchema = z.object({ limit, offset });

export type CreateArticleBody = z.infer<typeof createArticleSchema>;
export type UpdateArticleBody = z.infer<typeof updateArticleSchema>;
export type ListArticlesQueryInput = z.infer<typeof listArticlesQuerySchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

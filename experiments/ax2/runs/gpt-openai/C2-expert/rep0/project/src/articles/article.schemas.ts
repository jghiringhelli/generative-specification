import { z } from "zod";

export const DEFAULT_ARTICLE_LIMIT = 20;
export const DEFAULT_ARTICLE_OFFSET = 0;

export const articleListSchema = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit: z.coerce.number().int().nonnegative().default(DEFAULT_ARTICLE_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(DEFAULT_ARTICLE_OFFSET)
});

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string().min(1)).optional()
  })
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    tagList: z.array(z.string().min(1)).optional()
  }).refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

import { z } from "zod";

const paginationValue = z.coerce.number().int().nonnegative();

export const articleListQuerySchema = z.object({
  tag: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  favorited: z.string().min(1).optional(),
  limit: paginationValue.default(20),
  offset: paginationValue.default(0)
});

export const articlePaginationSchema = z.object({
  limit: paginationValue.default(20),
  offset: paginationValue.default(0)
});

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string().min(1)).default([])
  })
});

export const updateArticleSchema = z.object({
  article: z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      body: z.string().min(1).optional(),
      tagList: z.array(z.string().min(1)).optional()
    })
    .refine((article) => Object.keys(article).length > 0, "At least one field is required")
});

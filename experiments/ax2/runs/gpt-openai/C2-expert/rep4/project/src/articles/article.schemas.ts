import { z } from "zod";

const articleFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
  tagList: z.array(z.string().min(1)).default([])
};

export const createArticleSchema = z.object({
  article: z.object(articleFields)
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: articleFields.title.optional(),
    description: articleFields.description.optional(),
    body: articleFields.body.optional(),
    tagList: z.array(z.string().min(1)).optional()
  }).refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const articleListQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().int().nonnegative().default(20),
  offset: z.coerce.number().int().nonnegative().default(0)
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>["article"];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>["article"];
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;

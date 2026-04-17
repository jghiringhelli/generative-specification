import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank"),
    description: z.string().min(1, "can't be blank"),
    body: z.string().min(1, "can't be blank"),
    tagList: z.array(z.string()).optional()
  })
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, "can't be blank").optional(),
    description: z.string().min(1, "can't be blank").optional(),
    body: z.string().min(1, "can't be blank").optional(),
    tagList: z.array(z.string()).optional()
  })
});

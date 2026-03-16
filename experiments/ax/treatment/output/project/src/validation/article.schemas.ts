import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty'),
    description: z.string().min(1, 'Description cannot be empty'),
    body: z.string().min(1, 'Body cannot be empty'),
    tagList: z.array(z.string()).optional()
  })
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    body: z.string().min(1, 'Body cannot be empty').optional()
  })
});


/**
 * Input validation schemas for article endpoints.
 */

import { z } from 'zod';

export const createArticleSchema = z.object({
  article: z.object({
    title: z
      .string({
        required_error: "title can't be blank"
      })
      .min(1, { message: "title can't be blank" }),
    description: z
      .string({
        required_error: "description can't be blank"
      })
      .min(1, { message: "description can't be blank" }),
    body: z
      .string({
        required_error: "body can't be blank"
      })
      .min(1, { message: "body can't be blank" }),
    tagList: z.array(z.string()).optional().default([])
  })
});

export const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1, { message: "title can't be blank" }).optional(),
    description: z.string().min(1, { message: "description can't be blank" }).optional(),
    body: z.string().min(1, { message: "body can't be blank" }).optional()
  })
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

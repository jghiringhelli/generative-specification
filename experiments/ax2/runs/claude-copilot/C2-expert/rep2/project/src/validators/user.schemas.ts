import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'is required'),
    email: z.string().email('must be a valid email'),
    password: z.string().min(1, 'is required')
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('must be a valid email'),
    password: z.string().min(1, 'is required')
  })
});

export const updateUserSchema = z.object({
  user: z
    .object({
      username: z.string().min(1).optional(),
      email: z.string().email('must be a valid email').optional(),
      password: z.string().min(1).optional(),
      bio: z.string().optional(),
      image: z.string().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

export type RegisterInput = z.infer<typeof registerSchema>['user'];
export type LoginInput = z.infer<typeof loginSchema>['user'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

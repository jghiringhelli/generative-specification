import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    email: z.string().email('must be a valid email'),
    username: z.string().min(1, 'is required'),
    password: z.string().min(1, 'is required'),
  }),
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('must be a valid email'),
    password: z.string().min(1, 'is required'),
  }),
});

export const updateUserSchema = z.object({
  user: z
    .object({
      email: z.string().email('must be a valid email').optional(),
      username: z.string().min(1, 'is required').optional(),
      password: z.string().min(1, 'is required').optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'at least one field is required',
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['user'];
export type LoginInput = z.infer<typeof loginSchema>['user'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

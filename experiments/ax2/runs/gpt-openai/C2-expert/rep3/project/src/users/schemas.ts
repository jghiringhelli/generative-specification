import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>['user'];
export type LoginInput = z.infer<typeof loginSchema>['user'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

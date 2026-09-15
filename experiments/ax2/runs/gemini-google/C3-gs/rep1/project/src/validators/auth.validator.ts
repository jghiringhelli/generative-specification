import { z } from 'zod';

export const registerUserSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'username cannot be empty'),
    email: z.string().email('email must be a valid email'),
    password: z.string().min(6, 'password must be at least 6 characters'),
  }),
});

export const loginUserSchema = z.object({
  user: z.object({
    email: z.string().email('email must be a valid email'),
    password: z.string().min(1, 'password cannot be empty'),
  }),
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('email must be a valid email').optional(),
    username: z.string().min(1, 'username cannot be empty').optional(),
    password: z.string().min(6, 'password must be at least 6 characters').optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url('image must be a valid URL').or(z.literal('')).nullable().optional(),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>['user'];
export type LoginUserInput = z.infer<typeof loginUserSchema>['user'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

import { z } from 'zod';

export const registerUserSchema = z.object({
  user: z.object({
    username: z.string({ required_error: 'username is required' }).min(1, 'username cannot be empty'),
    email: z.string({ required_error: 'email is required' }).email('email must be a valid email'),
    password: z.string({ required_error: 'password is required' }).min(1, 'password cannot be empty'),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>['user'];

export const loginUserSchema = z.object({
  user: z.object({
    email: z.string({ required_error: 'email is required' }).email('email must be a valid email'),
    password: z.string({ required_error: 'password is required' }).min(1, 'password cannot be empty'),
  }),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>['user'];

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('email must be a valid email').optional(),
    username: z.string().min(1, 'username cannot be empty').optional(),
    password: z.string().min(1, 'password cannot be empty').optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

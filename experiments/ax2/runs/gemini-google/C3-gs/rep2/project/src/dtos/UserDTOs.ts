import { z } from 'zod';

export const RegisterUserSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'Username is required').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const LoginUserSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const UpdateUserSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email address').optional(),
    username: z.string().min(1).max(50).optional(),
    password: z.string().min(6).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>['user'];
export type LoginUserInput = z.infer<typeof LoginUserSchema>['user'];
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>['user'];

export interface UserResponseData {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponseDTO {
  user: UserResponseData;
}

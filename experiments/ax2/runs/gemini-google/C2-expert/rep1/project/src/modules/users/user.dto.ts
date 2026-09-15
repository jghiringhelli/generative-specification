import { z } from 'zod';

export const registerUserSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'username is required').max(50, 'username is too long'),
    email: z.string().email('email is invalid'),
    password: z.string().min(6, 'password must be at least 6 characters')
  })
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  user: z.object({
    email: z.string().email('email is invalid'),
    password: z.string().min(1, 'password is required')
  })
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('email is invalid').optional(),
    username: z.string().min(1, 'username cannot be empty').max(50).optional(),
    password: z.string().min(6, 'password must be at least 6 characters').optional(),
    image: z.string().url('image must be a valid URL').nullable().optional().or(z.literal('')),
    bio: z.string().nullable().optional()
  })
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface UserResponseData {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponse {
  user: UserResponseData;
}

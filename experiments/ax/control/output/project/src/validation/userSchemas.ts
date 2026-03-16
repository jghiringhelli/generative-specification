import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    bio: z.string().optional(),
    image: z.string().url('Image must be a valid URL').optional()
  })
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

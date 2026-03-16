import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(1, 'Username cannot be empty'),
    password: z.string().min(1, 'Password cannot be empty')
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password cannot be empty')
  })
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(1, 'Password cannot be empty').optional(),
    bio: z.string().optional(),
    image: z.string().url('Image must be a valid URL').optional()
  })
});

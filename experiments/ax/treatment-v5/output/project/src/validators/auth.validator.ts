
/**
 * Input validation schemas for authentication endpoints.
 * Uses Zod for runtime type checking and validation.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    email: z
      .string({
        required_error: "email can't be blank"
      })
      .email({ message: 'email must be valid' })
      .toLowerCase(),
    username: z
      .string({
        required_error: "username can't be blank"
      })
      .min(1, { message: "username can't be blank" })
      .max(50, { message: 'username must be 50 characters or less' }),
    password: z
      .string({
        required_error: "password can't be blank"
      })
      .min(8, { message: 'password must be at least 8 characters' })
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: z
      .string({
        required_error: "email can't be blank"
      })
      .email({ message: 'email must be valid' })
      .toLowerCase(),
    password: z
      .string({
        required_error: "password can't be blank"
      })
      .min(1, { message: "password can't be blank" })
  })
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email({ message: 'email must be valid' }).toLowerCase().optional(),
    username: z
      .string()
      .min(1, { message: "username can't be blank" })
      .max(50, { message: 'username must be 50 characters or less' })
      .optional(),
    password: z
      .string()
      .min(8, { message: 'password must be at least 8 characters' })
      .optional(),
    bio: z.string().optional(),
    image: z.string().url({ message: 'image must be a valid URL' }).optional()
  })
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

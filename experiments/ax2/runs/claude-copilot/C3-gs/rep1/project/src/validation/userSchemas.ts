import { z } from '../validation/validate';

/**
 * Registration request schema.
 */
export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank"),
    email: z.string().email('is invalid'),
    password: z.string().min(8, 'is too short (minimum is 8 characters)'),
  }),
});

/**
 * Login request schema.
 */
export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

/**
 * Update-user request schema. All fields optional.
 */
export const updateUserSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank").optional(),
    email: z.string().email('is invalid').optional(),
    password: z.string().min(8, 'is too short (minimum is 8 characters)').optional(),
    bio: z.string().optional(),
    image: z.string().optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

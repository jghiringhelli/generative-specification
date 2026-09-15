import { z } from 'zod';

/** Zod schema for user registration. */
export const registerSchema = z.object({
  user: z.object({
    email: z.string().email('must be a valid email'),
    username: z.string().min(1, 'is required'),
    password: z.string().min(1, 'is required')
  })
});

/** Zod schema for login. */
export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('must be a valid email'),
    password: z.string().min(1, 'is required')
  })
});

/** Zod schema for updating the current user. All fields optional. */
export const updateUserSchema = z.object({
  user: z
    .object({
      email: z.string().email('must be a valid email').optional(),
      username: z.string().min(1, 'is required').optional(),
      password: z.string().min(1, 'is required').optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field is required'
    })
});

/** Registration input DTO. */
export type RegisterInput = z.infer<typeof registerSchema>['user'];
/** Login input DTO. */
export type LoginInput = z.infer<typeof loginSchema>['user'];
/** Update input DTO. */
export type UpdateUserInput = z.infer<typeof updateUserSchema>['user'];

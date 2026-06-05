/**
 * Request validation schemas for the user/auth endpoints (Zod).
 *
 * Validation happens at the HTTP boundary (api.md): the body is parsed into a
 * typed DTO and any failure becomes a {@link ValidationError} carrying
 * per-field messages, which the error handler renders as a 422 RealWorld
 * envelope (`{ errors: { field: [..] } }`). RealWorld wraps every payload in a
 * top-level `user` object.
 */
import { z } from 'zod';

export { parseOrThrow } from './validation.js';

const email = z.string().trim().min(1, "can't be blank").email('is invalid');
const username = z.string().trim().min(1, "can't be blank");
const password = z.string().min(1, "can't be blank").min(8, 'must be at least 8 characters');

export const registerSchema = z.object({
  user: z.object({ username, email, password }),
});

export const loginSchema = z.object({
  user: z.object({
    email,
    password: z.string().min(1, "can't be blank"),
  }),
});

export const updateUserSchema = z.object({
  user: z
    .object({
      email: email.optional(),
      username: username.optional(),
      password: password.optional(),
      bio: z.string().nullable().optional(),
      image: z.string().trim().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'at least one field must be provided',
    }),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;

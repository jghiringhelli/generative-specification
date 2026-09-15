import { z } from 'zod';

const email = z.string().email();
const password = z.string().min(8);
const username = z.string().min(1);

export const registerSchema = z.object({
  user: z.object({ email, username, password }),
});

export const loginSchema = z.object({
  user: z.object({ email, password: z.string().min(1) }),
});

export const updateUserSchema = z.object({
  user: z.object({
    email: email.optional(),
    username: username.optional(),
    password: password.optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
});

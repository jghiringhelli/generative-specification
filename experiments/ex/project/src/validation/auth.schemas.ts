import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email("is invalid"),
    username: z.string().min(1, "can't be blank"),
    password: z.string().min(1, "can't be blank")
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email("is invalid"),
    password: z.string().min(1, "can't be blank")
  })
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().min(1, "can't be blank").email("is invalid").optional(),
    username: z.string().min(1, "can't be blank").optional(),
    password: z.string().min(1, "can't be blank").optional(),
    bio: z.string().optional().nullable().transform(v => v === '' ? null : v),
    image: z.string().optional().nullable().transform(v => v === '' ? null : v)
  })
});

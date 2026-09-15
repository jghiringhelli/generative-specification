import { z } from 'zod';

export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank"),
    email: z.string().email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

export const loginSchema = z.object({
  user: z.object({
    email: z.string().email('is invalid'),
    password: z.string().min(1, "can't be blank"),
  }),
});

export const updateUserSchema = z.object({
  user: z
    .object({
      username: z.string().min(1, "can't be blank").optional(),
      email: z.string().email('is invalid').optional(),
      password: z.string().min(1, "can't be blank").optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "can't be blank",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

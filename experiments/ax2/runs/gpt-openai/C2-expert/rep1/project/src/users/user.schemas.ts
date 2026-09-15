import { z } from "zod";

const emailSchema = z.string().email();
const usernameSchema = z.string().min(1);
const passwordSchema = z.string().min(8);

export const registerSchema = z.object({
  user: z.object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema
  })
});

export const loginSchema = z.object({
  user: z.object({
    email: emailSchema,
    password: z.string().min(1)
  })
});

export const updateUserSchema = z.object({
  user: z
    .object({
      email: emailSchema.optional(),
      username: usernameSchema.optional(),
      password: passwordSchema.optional(),
      bio: z.string().nullable().optional(),
      image: z.string().url().nullable().optional()
    })
    .refine((user) => Object.keys(user).length > 0, "At least one field is required")
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

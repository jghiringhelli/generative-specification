import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  user: credentialsSchema.extend({
    username: z.string().min(1)
  })
});

export const loginSchema = z.object({
  user: credentialsSchema
});

export const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    bio: z.string().nullable().optional(),
    image: z.string().url().nullable().optional()
  }).refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export type RegisterRequest = z.infer<typeof registerSchema>["user"];
export type LoginRequest = z.infer<typeof loginSchema>["user"];
export type UpdateUserRequest = z.infer<typeof updateUserSchema>["user"];

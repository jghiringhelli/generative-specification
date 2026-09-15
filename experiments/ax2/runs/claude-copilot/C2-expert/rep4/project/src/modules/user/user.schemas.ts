import { z } from "zod";

/** Zod schema for the registration request body. */
export const registerSchema = z.object({
  user: z.object({
    username: z.string().min(1, "can't be blank"),
    email: z.string().email("must be a valid email"),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Zod schema for the login request body. */
export const loginSchema = z.object({
  user: z.object({
    email: z.string().email("must be a valid email"),
    password: z.string().min(1, "can't be blank"),
  }),
});

/** Zod schema for the update-user request body. */
export const updateUserSchema = z.object({
  user: z
    .object({
      email: z.string().email("must be a valid email").optional(),
      username: z.string().min(1, "can't be blank").optional(),
      password: z.string().min(1, "can't be blank").optional(),
      bio: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "can't be empty",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>["user"];
export type LoginInput = z.infer<typeof loginSchema>["user"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["user"];

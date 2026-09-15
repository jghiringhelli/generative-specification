import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { prisma } from "../database";
import { createToken } from "../auth/auth";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors";

const PASSWORD_ROUNDS = 10;

export interface UserResponse {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

interface RegisterInput {
  username?: string;
  email?: string;
  password?: string;
}

interface LoginInput {
  email?: string;
  password?: string;
}

interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

function toUserResponse(user: User): UserResponse {
  return {
    email: user.email,
    token: createToken(user.id),
    username: user.username,
    bio: user.bio,
    image: user.image,
  };
}

function validateRegistration(input: RegisterInput): asserts input is Required<RegisterInput> {
  const errors: Record<string, string[]> = {};
  if (!input.username?.trim()) errors.username = ["can't be blank"];
  if (!input.email?.trim()) errors.email = ["can't be blank"];
  if (!input.password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/** Registers a user with a unique email and username. */
export async function registerUser(input: RegisterInput): Promise<UserResponse> {
  validateRegistration(input);
  try {
    const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
    const user = await prisma.user.create({
      data: {
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash,
      },
    });
    return toUserResponse(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ValidationError({ email: ["or username has already been taken"] });
    }
    throw error;
  }
}

/** Authenticates a user using email and password. */
export async function loginUser(input: LoginInput): Promise<UserResponse> {
  if (!input.email || !input.password) {
    throw new ValidationError({ "email or password": ["is invalid"] });
  }
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new UnauthorizedError("Invalid email or password");
  }
  return toUserResponse(user);
}

/** Returns the current user. */
export async function getCurrentUser(userId: number): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  return toUserResponse(user);
}

/** Updates editable fields on the current user. */
export async function updateCurrentUser(
  userId: number,
  input: UpdateUserInput,
): Promise<UserResponse> {
  const errors: Record<string, string[]> = {};
  if (input.email !== undefined && !input.email.trim()) errors.email = ["can't be blank"];
  if (input.username !== undefined && !input.username.trim()) errors.username = ["can't be blank"];
  if (input.password !== undefined && !input.password) errors.password = ["can't be blank"];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const data = {
    ...(input.email !== undefined && { email: input.email.trim().toLowerCase() }),
    ...(input.username !== undefined && { username: input.username.trim() }),
    ...(input.bio !== undefined && { bio: input.bio }),
    ...(input.image !== undefined && { image: input.image }),
    ...(input.password !== undefined && {
      passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
    }),
  };
  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return toUserResponse(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ValidationError({ email: ["or username has already been taken"] });
    }
    throw error;
  }
}

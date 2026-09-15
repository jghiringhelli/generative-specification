import { Express } from "express";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

/** A registered test user with its auth token. */
export interface TestUser {
  id: number;
  email: string;
  username: string;
  password: string;
  token: string;
}

/**
 * Build a fresh Express app instance for tests.
 * @returns The configured Express application.
 */
export function testApp(): Express {
  return createApp();
}

/**
 * Remove all rows from every table so each test starts clean.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Register a user through the HTTP API and return its credentials.
 * @param app The Express application under test.
 * @param overrides Optional field overrides.
 * @returns The registered user with a valid token.
 */
export async function registerUser(
  app: Express,
  overrides: Partial<{ email: string; username: string; password: string }> = {},
): Promise<TestUser> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const email = overrides.email ?? `user-${suffix}@example.com`;
  const username = overrides.username ?? `user_${suffix}`;
  const password = overrides.password ?? "password123";
  const response = await request(app)
    .post("/api/users")
    .send({ user: { email, username, password } });
  return {
    id: 0,
    email,
    username,
    password,
    token: response.body.user.token,
  };
}

/**
 * Authorization header helper for a token.
 * @param token The JWT string.
 * @returns The Token authorization header value.
 */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

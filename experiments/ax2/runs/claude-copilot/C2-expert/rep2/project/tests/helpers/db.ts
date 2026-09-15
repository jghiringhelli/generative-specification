import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

/**
 * Builds a fresh app instance bound to the real (test) database.
 * @returns the Express app under test.
 */
export function buildTestApp(): Express {
  return createApp();
}

/**
 * Removes all rows from every table so each test starts from a clean slate.
 * Order respects foreign-key dependencies.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.articleFavorite.deleteMany();
  await prisma.article.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}

/** Closes the Prisma connection after a suite completes. */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export interface RegisteredUser {
  email: string;
  username: string;
  password: string;
  token: string;
}

/**
 * Registers a user through the public API and returns credentials + token.
 * @param app the app under test.
 * @param overrides optional field overrides.
 * @returns the registered user with its auth token.
 */
export async function registerUser(
  app: Express,
  overrides: Partial<{ email: string; username: string; password: string }> = {}
): Promise<RegisteredUser> {
  const email = overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const username = overrides.username ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const password = overrides.password ?? 'password123';
  const response = await request(app)
    .post('/api/users')
    .send({ user: { email, username, password } });
  return { email, username, password, token: response.body.user.token };
}

/** Formats an Authorization header value for a token. */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

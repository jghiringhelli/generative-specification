import { prisma } from '../src/lib/prisma';
import request from 'supertest';
import { Express } from 'express';

/** A registered test user with credentials and an auth token. */
export interface TestUser {
  email: string;
  username: string;
  password: string;
  token: string;
}

/**
 * Registers a user through the API and returns credentials plus a token.
 * @param app the Express app under test
 * @param overrides optional field overrides
 * @returns the registered test user
 */
export async function createUser(
  app: Express,
  overrides: Partial<Omit<TestUser, 'token'>> = {},
): Promise<TestUser> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const user = {
    email: overrides.email ?? `user-${suffix}@example.com`,
    username: overrides.username ?? `user-${suffix}`,
    password: overrides.password ?? 'password123',
  };
  const response = await request(app).post('/api/users').send({ user });
  return { ...user, token: response.body.user.token as string };
}

/**
 * Deletes all rows from every table in dependency-safe order so each
 * integration test starts from a clean database.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Closes the shared Prisma connection. Call in afterAll.
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

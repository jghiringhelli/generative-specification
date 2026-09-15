import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { AppConfig } from '../../src/config/env';

/** JWT secret used across the integration suite. */
export const TEST_JWT_SECRET = 'test-secret-do-not-use-in-production';

/** Shared Prisma client for the integration suite. */
export const prisma = new PrismaClient();

/** Test configuration wiring the shared secret. */
export const testConfig: AppConfig = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: TEST_JWT_SECRET,
  port: 0
};

/**
 * Builds the application under test with the shared Prisma client.
 * @returns the configured Express {@link Application}
 */
export function buildTestApp(): Application {
  return createApp(prisma, testConfig);
}

/**
 * Removes all rows from every table so each test starts from a clean slate.
 * Order respects foreign-key dependencies.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
}

/** Registration payload shape for test helpers. */
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

/** Result of registering a user through the API. */
export interface RegisteredUser {
  token: string;
  username: string;
  email: string;
}

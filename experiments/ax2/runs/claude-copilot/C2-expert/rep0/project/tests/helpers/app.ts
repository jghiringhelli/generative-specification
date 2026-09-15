import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';

/** JWT secret used across the integration test suite. */
export const TEST_JWT_SECRET = 'test-secret';

/**
 * Builds an Express app instance configured with the test JWT secret.
 * @returns The configured {@link Express} application.
 */
export function buildTestApp(): Express {
  return createApp(TEST_JWT_SECRET);
}

/** A registered user together with the token issued at registration. */
export interface RegisteredUser {
  readonly username: string;
  readonly email: string;
  readonly token: string;
}

let userCounter = 0;

/**
 * Registers a new unique user through the HTTP boundary.
 * @param app The Express app under test.
 * @param overrides Optional field overrides for username/email/password.
 * @returns The registered user and its token.
 */
export async function registerUser(
  app: Express,
  overrides: Partial<{ username: string; email: string; password: string }> = {}
): Promise<RegisteredUser> {
  userCounter += 1;
  const username = overrides.username ?? `user${userCounter}`;
  const email = overrides.email ?? `user${userCounter}@example.com`;
  const password = overrides.password ?? 'password123';
  const response = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password } });
  return { username, email, token: response.body.user.token };
}

/** Formats an Authorization header value using the RealWorld Token scheme. */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

import request from 'supertest';
import { Express } from 'express';

/** A registered user's credentials and token for use in tests. */
export interface RegisteredUser {
  token: string;
  username: string;
  email: string;
}

/**
 * Register a user through the HTTP API and return its token and identity.
 * @param app - The Express app.
 * @param overrides - Optional field overrides.
 * @returns The registered user's token and identity.
 */
export async function registerUser(
  app: Express,
  overrides: Partial<{ username: string; email: string; password: string }> = {},
): Promise<RegisteredUser> {
  const username = overrides.username ?? `user_${Math.random().toString(36).slice(2, 8)}`;
  const email = overrides.email ?? `${username}@example.com`;
  const password = overrides.password ?? 'password123';

  const response = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password } });

  return { token: response.body.user.token, username, email };
}

/**
 * Format a RealWorld Authorization header value.
 * @param token - The JWT.
 * @returns The header value.
 */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

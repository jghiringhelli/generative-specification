import request from 'supertest';
import { Application } from 'express';

/** Credentials returned when registering a test user. */
export interface RegisteredUser {
  token: string;
  username: string;
  email: string;
}

let counter = 0;

/**
 * Register a user through the HTTP boundary and return its token/identity.
 * Ensures the user id/username resolver caches stay in sync via the real flow.
 */
export async function registerUser(
  app: Application,
  overrides: Partial<{ username: string; email: string; password: string }> = {},
): Promise<RegisteredUser> {
  counter += 1;
  const username = overrides.username ?? `user${counter}`;
  const email = overrides.email ?? `user${counter}@example.com`;
  const password = overrides.password ?? 'password123';

  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password } });

  return { token: res.body.user.token, username, email };
}

/** Build the RealWorld `Authorization: Token <jwt>` header value. */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

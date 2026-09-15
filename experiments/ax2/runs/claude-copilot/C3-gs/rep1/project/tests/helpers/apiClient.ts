import request from 'supertest';
import { Application } from 'express';

/**
 * Register a user via the API and return the auth token.
 * @param app - The Express application.
 * @param overrides - Optional field overrides for the registration payload.
 * @returns The token and the created user body.
 */
export async function registerUser(
  app: Application,
  overrides: Partial<{ username: string; email: string; password: string }> = {},
): Promise<{ token: string; user: Record<string, unknown> }> {
  const payload = {
    user: {
      username: overrides.username ?? 'alice',
      email: overrides.email ?? 'alice@example.com',
      password: overrides.password ?? 'password123',
    },
  };
  const response = await request(app).post('/api/users').send(payload);
  return { token: response.body.user.token, user: response.body.user };
}

/**
 * Build an Authorization header value for a token.
 * @param token - The JWT.
 * @returns The header value using the Conduit `Token` scheme.
 */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

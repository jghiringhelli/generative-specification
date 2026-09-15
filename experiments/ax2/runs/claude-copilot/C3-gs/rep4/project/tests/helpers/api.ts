import request from 'supertest';
import { Application } from 'express';

/**
 * Register a user through the HTTP API and return the issued token and username.
 * @param app the Express app under test.
 * @param username unique username.
 * @param email unique email.
 */
export async function registerUser(
  app: Application,
  username: string,
  email: string,
): Promise<{ token: string; username: string }> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password: 'secret123' } });
  return { token: res.body.user.token as string, username };
}

/** Authorization header value for a token. */
export function authHeader(token: string): string {
  return `Token ${token}`;
}

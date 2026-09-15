import request from 'supertest';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/auth/AuthService';
import { TagService } from '../../src/tags/TagService';
import { InMemoryTagRepository } from '../fixtures/InMemoryTagRepository';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

test('GET /api/tags returns unique tags used by articles', async () => {
  const tokens = new TestTokenService();
  const app = createApp({
    authService: new AuthService(
      new InMemoryUserRepository(),
      new TestPasswordHasher(),
      tokens,
    ),
    tokenService: tokens,
    tagService: new TagService(new InMemoryTagRepository({
      first: ['typescript', 'realworld'],
      second: ['typescript', 'express'],
    })),
  });

  const response = await request(app).get('/api/tags').expect(200);
  expect(response.body).toEqual({
    tags: ['express', 'realworld', 'typescript'],
  });
});

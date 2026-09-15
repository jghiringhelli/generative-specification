import request from 'supertest';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/auth/AuthService';
import { ProfileService } from '../../src/profiles/ProfileService';
import { InMemoryProfileRepository } from '../fixtures/InMemoryProfileRepository';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

function createTestApp() {
  const tokens = new TestTokenService();
  const authService = new AuthService(
    new InMemoryUserRepository(),
    new TestPasswordHasher(),
    tokens,
  );
  const profileService = new ProfileService(new InMemoryProfileRepository([{
    id: '2',
    username: 'bob',
    bio: 'Author',
    image: null,
  }]));
  return createApp({ authService, tokenService: tokens, profileService });
}

async function registerViewer(app: ReturnType<typeof createTestApp>) {
  await request(app).post('/api/users').send({
    user: {
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    },
  });
}

describe('profile endpoints', () => {
  test('GET /api/profiles/:username returns a public profile', async () => {
    const response = await request(createTestApp())
      .get('/api/profiles/bob')
      .expect(200);
    expect(response.body.profile).toEqual({
      username: 'bob',
      bio: 'Author',
      image: null,
      following: false,
    });
  });

  test('POST /api/profiles/:username/follow follows a profile', async () => {
    const app = createTestApp();
    await registerViewer(app);
    const response = await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', 'Token token-1')
      .expect(200);
    expect(response.body.profile.following).toBe(true);
  });

  test('DELETE /api/profiles/:username/follow unfollows a profile', async () => {
    const app = createTestApp();
    await registerViewer(app);
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', 'Token token-1');
    const response = await request(app)
      .delete('/api/profiles/bob/follow')
      .set('Authorization', 'Token token-1')
      .expect(200);
    expect(response.body.profile.following).toBe(false);
  });

  test('follow requires authentication', async () => {
    const response = await request(createTestApp())
      .post('/api/profiles/bob/follow')
      .expect(401);
    expect(response.body.errors.body).toEqual([
      'Authorization token is required',
    ]);
  });

  test('missing profiles return 404', async () => {
    const response = await request(createTestApp())
      .get('/api/profiles/missing')
      .expect(404);
    expect(response.body.errors.body).toEqual(['Profile missing not found']);
  });
});

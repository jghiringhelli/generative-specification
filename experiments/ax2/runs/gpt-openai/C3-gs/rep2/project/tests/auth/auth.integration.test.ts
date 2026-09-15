import request from 'supertest';
import { AuthService } from '../../src/auth/AuthService';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';
import { ProfileService } from '../../src/profiles/ProfileService';
import { InMemoryProfileRepository } from '../support/InMemoryProfileRepository';

function createTestApplication() {
  const tokens = new TestTokenService();
  const users = new InMemoryUserRepository();
  const auth = new AuthService(
    users,
    new TestPasswordHasher(),
    tokens,
  );
  const profiles = new ProfileService(new InMemoryProfileRepository(users));
  return createApp({
    authService: auth,
    tokenService: tokens,
    profileService: profiles,
  });
}

describe('authentication endpoints', () => {
  it('registers, logs in, gets, and updates a user', async () => {
    const app = createTestApplication();
    const registration = await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password1',
      },
    }).expect(201);

    const token = registration.body.user.token as string;
    await request(app).post('/api/users/login').send({
      user: { email: 'alice@example.com', password: 'password1' },
    }).expect(200).expect(({ body }) => {
      expect(body.user.username).toBe('alice');
    });

    await request(app).get('/api/user')
      .set('Authorization', `Token ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe('alice@example.com');
      });

    await request(app).put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'Writer' } })
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.bio).toBe('Writer');
      });
  });

  it('requires authentication for current-user endpoints', async () => {
    const app = createTestApplication();
    await request(app).get('/api/user').expect(401);
    await request(app).put('/api/user').send({ user: { bio: 'No' } }).expect(401);
  });

  it('returns API-formatted validation and token errors', async () => {
    const app = createTestApplication();
    await request(app).post('/api/users')
      .send({ user: { email: 'invalid', username: '', password: 'short' } })
      .expect(422)
      .expect(({ body }) => {
        expect(body.errors.body).toEqual(expect.any(Array));
      });
    await request(app).get('/api/user')
      .set('Authorization', 'Token invalid')
      .expect(401)
      .expect({ errors: { body: ['Invalid test token'] } });
  });
});

import request from 'supertest';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/auth/AuthService';
import { ProfileService } from '../../src/profiles/ProfileService';
import { TestPasswordHasher, TestTokenService } from '../support/AuthTestDoubles';
import { InMemoryProfileRepository } from '../support/InMemoryProfileRepository';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';

async function createFixture() {
  const users = new InMemoryUserRepository();
  const tokens = new TestTokenService();
  const auth = new AuthService(users, new TestPasswordHasher(), tokens);
  const profiles = new ProfileService(new InMemoryProfileRepository(users));
  const app = createApp({
    authService: auth,
    tokenService: tokens,
    profileService: profiles,
  });
  await auth.register({
    email: 'alice@example.com',
    username: 'alice',
    password: 'password1',
  });
  const bob = await auth.register({
    email: 'bob@example.com',
    username: 'bob',
    password: 'password2',
  });
  return { app, bobToken: bob.token };
}

describe('profile endpoints', () => {
  it('gets a public profile', async () => {
    const { app } = await createFixture();
    await request(app).get('/api/profiles/alice')
      .expect(200)
      .expect(({ body }) => {
        expect(body.profile).toMatchObject({ username: 'alice', following: false });
      });
  });

  it('follows a profile', async () => {
    const { app, bobToken } = await createFixture();
    await request(app).post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.profile.following).toBe(true);
      });
  });

  it('unfollows a profile', async () => {
    const { app, bobToken } = await createFixture();
    await request(app).post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);
    await request(app).delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.profile.following).toBe(false);
      });

      it('returns not found for an unknown profile', async () => {
        const { app } = await createFixture();
        await request(app).get('/api/profiles/missing')
          .expect(404)
          .expect({ errors: { body: ['Profile not found'] } });
      });
  });
});

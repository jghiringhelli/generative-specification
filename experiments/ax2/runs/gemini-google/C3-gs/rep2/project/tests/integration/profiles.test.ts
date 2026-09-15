import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';

describe('Profiles Integration Tests (All 3 Endpoints)', () => {
  let app: any;
  let token: string;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const profileRepository = new InMemoryProfileRepository(userRepository);
    const authService = new AuthService(userRepository, 'profile-test-secret', '1h');
    const profileService = new ProfileService(profileRepository);

    process.env.JWT_SECRET = 'profile-test-secret';
    app = createApp({ userRepository, profileRepository, authService, profileService });

    // Create target user to be viewed/followed
    await userRepository.create({
      username: 'authorJane',
      email: 'jane@example.com',
      passwordHash: 'hashJane',
      bio: 'Author bio',
      image: 'https://jane.img',
    });

    // Register active user to obtain auth token
    const regRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'readerBob',
          email: 'bob@example.com',
          password: 'password123',
        },
      });
    token = regRes.body.user.token;
  });

  describe('GET /api/profiles/:username', () => {
    it('should return profile with following=false for unauthenticated request', async () => {
      const response = await request(app).get('/api/profiles/authorJane');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile.username).toBe('authorJane');
      expect(response.body.profile.bio).toBe('Author bio');
      expect(response.body.profile.following).toBe(false);
    });

    it('should return 404 for unknown username', async () => {
      const response = await request(app).get('/api/profiles/nonExistentUser');

      expect(response.status).toBe(404);
      expect(response.body.errors).toHaveProperty('body');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('should follow user and return 200 with following=true', async () => {
      const response = await request(app)
        .post('/api/profiles/authorJane/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe('authorJane');
      expect(response.body.profile.following).toBe(true);

      // Verify GET profile with token now reflects following=true
      const getRes = await request(app)
        .get('/api/profiles/authorJane')
        .set('Authorization', `Token ${token}`);
      expect(getRes.body.profile.following).toBe(true);
    });

    it('should return 401 when unauthenticated', async () => {
      const response = await request(app).post('/api/profiles/authorJane/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors).toHaveProperty('body');
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // First follow
      await request(app)
        .post('/api/profiles/authorJane/follow')
        .set('Authorization', `Token ${token}`);
    });

    it('should unfollow user and return 200 with following=false', async () => {
      const response = await request(app)
        .delete('/api/profiles/authorJane/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.username).toBe('authorJane');
      expect(response.body.profile.following).toBe(false);
    });

    it('should return 401 when unauthenticated', async () => {
      const response = await request(app).delete('/api/profiles/authorJane/follow');

      expect(response.status).toBe(401);
    });
  });
});

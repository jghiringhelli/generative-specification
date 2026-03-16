import request from 'supertest';
import { app } from '../app';
import { cleanup, createUser } from './helpers';

describe('Profiles', () => {
  afterEach(async () => {
    await cleanup();
  });

  describe('GET /api/profiles/:username', () => {
    it('should get user profile without auth', async () => {
      await createUser({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg'
      });

      const response = await request(app).get('/api/profiles/testuser');

      expect(response.status).toBe(200);
      expect(response.body.profile).toMatchObject({
        username: 'testuser',
        bio: 'Test bio',
        image: 'https://example.com/image.jpg',
        following: false
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/profiles/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should show following status when authenticated', async () => {
      const user1 = await createUser({
        email: 'user1@test.com',
        username: 'user1',
        password: 'password123'
      });

      await createUser({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'user1@test.com',
            password: 'password123'
          }
        });

      const token = loginResponse.body.user.token;

      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${token}`);

      expect(response.body.profile.following).toBe(true);
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    let token: string;

    beforeEach(async () => {
      await createUser({
        email: 'user1@test.com',
        username: 'user1',
        password: 'password123'
      });

      await createUser({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'user1@test.com',
            password: 'password123'
          }
        });

      token = loginResponse.body.user.token;
    });

    it('should follow a user', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toMatchObject({
        username: 'user2',
        following: true
      });
    });

    it('should be idempotent', async () => {
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await request(app).post('/api/profiles/user2/follow');
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${token}`);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    let token: string;

    beforeEach(async () => {
      await createUser({
        email: 'user1@test.com',
        username: 'user1',
        password: 'password123'
      });

      await createUser({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'user1@test.com',
            password: 'password123'
          }
        });

      token = loginResponse.body.user.token;

      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);
    });

    it('should unfollow a user', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toMatchObject({
        username: 'user2',
        following: false
      });
    });

    it('should be idempotent', async () => {
      await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });
  });
});

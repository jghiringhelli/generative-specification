import request from 'supertest';
import app from '../index';

describe('Users & Authentication', () => {
  let authToken: string;
  let testUser = {
    email: 'test@test.com',
    username: 'testuser',
    password: 'password123'
  };

  describe('POST /api/users - Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ user: testUser });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('bio', null);
      expect(response.body.user).toHaveProperty('image', null);
      expect(response.body.user).not.toHaveProperty('password');
      
      authToken = response.body.user.token;
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ user: testUser });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ user: { email: 'test2@test.com' } });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login - Login', () => {
    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ user: { email: testUser.email, password: testUser.password } });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ user: { email: testUser.email, password: 'wrongpassword' } });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ user: { email: 'nonexistent@test.com', password: 'password' } });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user - Get Current User', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalidtoken');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/user - Update User', () => {
    it('should update user profile', async () => {
      const updates = {
        bio: 'I am a test user',
        image: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({ user: updates });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('bio', updates.bio);
      expect(response.body.user).toHaveProperty('image', updates.image);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/user')
        .send({ user: { bio: 'test' } });

      expect(response.status).toBe(401);
    });
  });
});

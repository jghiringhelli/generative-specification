import request from 'supertest';
import app from '../index';

describe('Users & Authentication', () => {
  const testUser = {
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
    });
  });
});

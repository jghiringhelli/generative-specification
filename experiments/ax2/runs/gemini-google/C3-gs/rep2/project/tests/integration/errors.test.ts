import request from 'supertest';
import { createApp } from '../../src/app';

describe('Error Handling and Edge Cases Integration Tests (401, 403, 404, 422)', () => {
  let app: any;

  beforeEach(() => {
    process.env.JWT_SECRET = 'error-test-secret';
    app = createApp();
  });

  describe('API Specification Error Format: {"errors": {"body": ["..."]}}', () => {
    it('should return 404 with standard body error format for unknown routes', async () => {
      const response = await request(app).get('/api/articles/non-existent-article-slug-xyz');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
      expect(response.body.errors.body.length).toBeGreaterThan(0);
    });

    it('should return 401 with standard body error format when accessing protected route without token', async () => {
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(response.body.errors.body).toContain('Authentication token is required');
    });

    it('should return 401 with standard body error format when token is invalid or corrupted', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Token completely-invalid-jwt-token');

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Invalid or expired token');
    });

    it('should return 422 with standard body error format on validation failure (missing body)', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: '',
            email: 'not-an-email',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveProperty('body');
      expect(Array.isArray(response.body.errors.body)).toBe(true);
    });

    it('should return 422 with standard body error format when invalid JSON is sent', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"user": { malformed JSON');

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Malformed JSON body in request');
    });
  });

  describe('Profile and Resource Error Paths', () => {
    it('should return 404 when querying non-existent profile', async () => {
      const response = await request(app).get('/api/profiles/thisUserDoesNotExistAnywhere');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('should return 404 when querying comments on non-existent article', async () => {
      const response = await request(app).get('/api/articles/random-slug-not-found/comments');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });
  });
});

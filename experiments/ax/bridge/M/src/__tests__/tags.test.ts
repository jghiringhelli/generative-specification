import request from 'supertest';
import app from '../index';

describe('Tags', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'tags-test@test.com',
          username: 'tagsuser',
          password: 'password123'
        }
      });
    authToken = user.body.user.token;

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authToken}`)
      .send({
        article: {
          title: 'Article with Tags',
          description: 'Test',
          body: 'Body',
          tagList: ['javascript', 'typescript', 'node']
        }
      });
  });

  describe('GET /api/tags', () => {
    it('should get list of all tags', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tags');
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags).toEqual(
        expect.arrayContaining(['javascript', 'typescript', 'node'])
      );
    });
  });
});

import request from 'supertest';
import app from '../index';

describe('Articles', () => {
  let authToken: string;
  let articleSlug: string;

  beforeAll(async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'article-test@test.com',
          username: 'articleuser',
          password: 'password123'
        }
      });
    authToken = user.body.user.token;
  });

  describe('POST /api/articles', () => {
    it('should create an article', async () => {
      const article = {
        title: 'Test Article',
        description: 'This is a test',
        body: 'Article body content',
        tagList: ['test', 'node']
      };

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authToken}`)
        .send({ article });

      expect(response.status).toBe(201);
      expect(response.body.article).toHaveProperty('slug');
      expect(response.body.article).toHaveProperty('title', article.title);
      expect(response.body.article.author).toHaveProperty('username', 'articleuser');

      articleSlug = response.body.article.slug;
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should get an article by slug', async () => {
      const response = await request(app).get(`/api/articles/${articleSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toHaveProperty('slug', articleSlug);
      expect(response.body.article).toHaveProperty('body');
    });
  });
});

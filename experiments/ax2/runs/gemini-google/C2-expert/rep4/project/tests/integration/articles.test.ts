import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Articles Endpoints Integration', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Username: string;
  let user2Username: string;

  beforeEach(async () => {
    // Reset test database
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Register User 1
    const user1Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'authorone',
          email: 'author1@example.com',
          password: 'password123',
        },
      });
    user1Token = user1Res.body.user.token;
    user1Username = user1Res.body.user.username;

    // Register User 2
    const user2Res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'authortwo',
          email: 'author2@example.com',
          password: 'password123',
        },
      });
    user2Token = user2Res.body.user.token;
    user2Username = user2Res.body.user.username;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/articles (create)', () => {
    it('creates an article successfully and returns 201 with body and author profile', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['dragons', 'training'],
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.article).toBeDefined();
      expect(response.body.article.title).toBe('How to train your dragon');
      expect(response.body.article.body).toBe('It takes a Jacobian');
      expect(response.body.article.tagList).toEqual(expect.arrayContaining(['dragons', 'training']));
      expect(response.body.article.author.username).toBe(user1Username);
    });

    it('returns 401 when creating article without authorization token', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Unauthorized Article',
            description: 'Test',
            body: 'Test',
          },
        });

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 422 when required fields are missing during article creation', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: '',
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/articles/:slug', () => {
    let createdSlug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Single Article Test',
            description: 'Description test',
            body: 'Full article body content',
            tagList: ['test'],
          },
        });
      createdSlug = res.body.article.slug;
    });

    it('returns the single article including body field', async () => {
      const response = await request(app).get(`/api/articles/${createdSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toBeDefined();
      expect(response.body.article.slug).toBe(createdSlug);
      expect(response.body.article.body).toBe('Full article body content');
    });

    it('returns 404 when querying a non-existent article slug', async () => {
      const response = await request(app).get('/api/articles/non-existent-slug-12345');

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/articles (list and filters)', () => {
    beforeEach(async () => {
      // Create article by user1 with tags 'nodejs', 'web'
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'NodeJS Architecture',
            description: 'Clean code in Node',
            body: 'Body content 1',
            tagList: ['nodejs', 'web'],
          },
        });

      // Create article by user2 with tags 'react', 'web'
      const art2Res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'React Components',
            description: 'Hooks and props',
            body: 'Body content 2',
            tagList: ['react', 'web'],
          },
        });

      // User1 favorites article by user2
      await request(app)
        .post(`/api/articles/${art2Res.body.article.slug}/favorite`)
        .set('Authorization', `Token ${user1Token}`);
    });

    it('lists all articles and omits body field from list items', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles.length).toBe(2);

      // Verify spec change: list items must NOT return body
      expect(response.body.articles[0].body).toBeUndefined();
      expect(response.body.articles[1].body).toBeUndefined();
    });

    it('filters articles by tag', async () => {
      const response = await request(app).get('/api/articles?tag=react');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].title).toBe('React Components');
    });

    it('filters articles by author username', async () => {
      const response = await request(app).get(`/api/articles?author=${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].title).toBe('NodeJS Architecture');
    });

    it('filters articles by favorited username', async () => {
      const response = await request(app).get(`/api/articles?favorited=${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].title).toBe('React Components');
    });

    it('respects pagination limit and offset parameters', async () => {
      const response = await request(app).get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articlesCount).toBe(2);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      // User 1 follows User 2
      await request(app)
        .post(`/api/profiles/${user2Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      // User 2 creates an article
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Feed Article from User 2',
            description: 'Only followers should see this in feed',
            body: 'Secret body',
            tagList: ['feed'],
          },
        });
    });

    it('returns articles from followed users and omits body field', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].title).toBe('Feed Article from User 2');
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('returns 401 when accessing feed without authorization token', async () => {
      const response = await request(app).get('/api/articles/feed');

      expect(response.status).toBe(401);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/articles/:slug', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original Description',
            body: 'Original Body',
          },
        });
      slug = res.body.article.slug;
    });

    it('updates article when user is the author and returns 200', async () => {
      const response = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Updated Title',
            description: 'Updated Description',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Updated Title');
      expect(response.body.article.description).toBe('Updated Description');
    });

    it('returns 403 when user is not the author of the article', async () => {
      const response = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Hacked Title',
          },
        });

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 401 when updating article without authorization token', async () => {
      const response = await request(app)
        .put(`/api/articles/${slug}`)
        .send({
          article: {
            title: 'No Auth Title',
          },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Delete Me',
            description: 'Soon gone',
            body: 'Gone body',
          },
        });
      slug = res.body.article.slug;
    });

    it('returns 403 when user is not author attempting to delete article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 401 when deleting article without authorization token', async () => {
      const response = await request(app).delete(`/api/articles/${slug}`);

      expect(response.status).toBe(401);
    });

    it('deletes article successfully when user is author and returns 200', async () => {
      const response = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);

      // Verify article is gone
      const getResponse = await request(app).get(`/api/articles/${slug}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST and DELETE /api/articles/:slug/favorite', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          article: {
            title: 'Favorite Candidate',
            description: 'Please favorite me',
            body: 'Good body',
          },
        });
      slug = res.body.article.slug;
    });

    it('returns 401 when favoriting without authorization token', async () => {
      const response = await request(app).post(`/api/articles/${slug}/favorite`);

      expect(response.status).toBe(401);
    });

    it('favorites article and increments favoritesCount and returns favorited as true', async () => {
      const response = await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('unfavorites article and decrements favoritesCount and returns favorited as false', async () => {
      await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .delete(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });
});

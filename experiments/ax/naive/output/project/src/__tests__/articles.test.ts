import request from 'supertest';
import { app } from '../app';
import { cleanup, createUser, createArticle } from './helpers';

describe('Articles', () => {
  afterEach(async () => {
    await cleanup();
  });

  describe('POST /api/articles', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;
    });

    it('should create an article', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body',
            tagList: ['test', 'article']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article).toMatchObject({
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        tagList: ['test', 'article'],
        favorited: false,
        favoritesCount: 0
      });
      expect(response.body.article.slug).toBeDefined();
      expect(response.body.article.author.username).toBe('testuser');
    });

    it('should create article without tags', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.tagList).toEqual([]);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body'
          }
        });
      expect(response.status).toBe(401);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Test Article'
          }
        });
      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/articles/:slug', () => {
    it('should get article by slug', async () => {
      const user = await createUser({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123'
      });

      const article = await createArticle(user.id, {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body',
        tagList: ['test']
      });

      const response = await request(app).get(`/api/articles/${article.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.article).toMatchObject({
        slug: article.slug,
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body'
      });
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app).get('/api/articles/nonexistent');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    let token: string;
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;

      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original description',
            body: 'Original body'
          }
        });
      articleSlug = createResponse.body.article.slug;
    });

    it('should update article', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'Updated Title',
            description: 'Updated description'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Updated Title');
      expect(response.body.article.description).toBe('Updated description');
      expect(response.body.article.body).toBe('Original body');
    });

    it('should update slug when title changes', async () => {
      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'New Title'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.article.slug).not.toBe(articleSlug);
    });

    it('should reject update by non-author', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'other@test.com',
            username: 'otheruser',
            password: 'password123'
          }
        });
      const otherToken = otherUserResponse.body.user.token;

      const response = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherToken}`)
        .send({
          article: {
            title: 'Hacked Title'
          }
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    let token: string;
    let articleSlug: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'test@test.com',
            username: 'testuser',
            password: 'password123'
          }
        });
      token = response.body.user.token;

      const createResponse = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${token}`)
        .send({
          article: {
            title: 'To Delete',
            description: 'Will be deleted',
            body: 'Gone soon'
          }
        });
      articleSlug = createResponse.body.article.slug;
    });

    it('should delete article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app).get(`/api/articles/${articleSlug}`);
      expect(getResponse.status).toBe(404);
    });

    it('should reject delete by non-author', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'other@test.com',
            username: 'otheruser',
            password: 'password123'
          }
        });
      const otherToken = otherUserResponse.body.user.token;

      const response = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set('Authorization', `Token ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      const user1 = await createUser({
        email: 'user1@test.com',
        username: 'user1',
        password: 'password123'
      });

      const user2 = await createUser({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

      await createArticle(user1.id, {
        slug: 'article-1',
        title: 'Article 1',
        description: 'First article',
        body: 'Body 1',
        tagList: ['tag1', 'tag2']
      });

      await createArticle(user2.id, {
        slug: 'article-2',
        title: 'Article 2',
        description: 'Second article',
        body: 'Body 2',
        tagList: ['tag2', 'tag3']
      });

      await createArticle(user1.id, {
        slug: 'article-3',
        title: 'Article 3',
        description: 'Third article',
        body: 'Body 3',
        tagList: ['tag1']
      });
    });

    it('should list all articles', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(3);
      expect(response.body.articles).toHaveLength(3);
      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('should filter by tag', async () => {
      const response = await request(app).get('/api/articles?tag=tag1');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles.every((a: any) => a.tagList.includes('tag1'))).toBe(true);
    });

    it('should filter by author', async () => {
      const response = await request(app).get('/api/articles?author=user1');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles.every((a: any) => a.author.username === 'user1')).toBe(true);
    });

    it('should paginate with limit and offset', async () => {
      const response = await request(app).get('/api/articles?limit=2&offset=1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articlesCount).toBe(3);
    });

    it('should filter by favorited', async () => {
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
        .post('/api/articles/article-2/favorite')
        .set('Authorization', `Token ${token}`);

      const response = await request(app).get('/api/articles?favorited=user1');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].slug).toBe('article-2');
    });
  });

  describe('GET /api/articles/feed', () => {
    let token: string;

    beforeEach(async () => {
      const user1 = await createUser({
        email: 'user1@test.com',
        username: 'user1',
        password: 'password123'
      });

      const user2 = await createUser({
        email: 'user2@test.com',
        username: 'user2',
        password: 'password123'
      });

      const user3 = await createUser({
        email: 'user3@test.com',
        username: 'user3',
        password: 'password123'
      });

      await createArticle(user2.id, {
        slug: 'article-by-user2',
        title: 'Article by User 2',
        description: 'From followed user',
        body: 'Body'
      });

      await createArticle(user3.id, {
        slug: 'article-by-user3',
        title: 'Article by User 3',
        description: 'From non-followed user',
        body: 'Body'
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

    it('should return feed from followed users', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].author.username).toBe('user2');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/articles/feed');
      expect(response.status).toBe(401);
    });

    it('should return empty feed if not following anyone', async () => {
      const newUserResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'newuser@test.com',
            username: 'newuser',
            password: 'password123'
          }
        });
      const newToken = newUserResponse.body.user.token;

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(0);
      expect(response.body.articles).toEqual([]);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    let token: string;
    let articleSlug: string;

    beforeEach(async () => {
      const user = await createUser({
        email: 'author@test.com',
        username: 'author',
        password: 'password123'
      });

      const article = await createArticle(user.id, {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test',
        body: 'Body'
      });
      articleSlug = article.slug;

      const loginResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'reader@test.com',
            username: 'reader',
            password: 'password123'
          }
        });
      token = loginResponse.body.user.token;
    });

    it('should favorite an article', async () => {
      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('should be idempotent', async () => {
      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${token}`);

      const response = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favoritesCount).toBe(1);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    let token: string;
    let articleSlug: string;

    beforeEach(async () => {
      const user = await createUser({
        email: 'author@test.com',
        username: 'author',
        password: 'password123'
      });

      const article = await createArticle(user.id, {
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test',
        body: 'Body'
      });
      articleSlug = article.slug;

      const loginResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'reader@test.com',
            username: 'reader',
            password: 'password123'
          }
        });
      token = loginResponse.body.user.token;

      await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${token}`);
    });

    it('should unfavorite an article', async () => {
      const response = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set('Authorization', `Token ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });
});

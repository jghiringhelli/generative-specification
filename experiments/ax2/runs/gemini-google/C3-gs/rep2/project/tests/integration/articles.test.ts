import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/InMemoryUserRepository';
import { InMemoryProfileRepository } from '../../src/repositories/in-memory/InMemoryProfileRepository';
import { InMemoryArticleRepository } from '../../src/repositories/in-memory/InMemoryArticleRepository';
import { AuthService } from '../../src/services/AuthService';
import { ProfileService } from '../../src/services/ProfileService';
import { ArticleService } from '../../src/services/ArticleService';

describe('Articles Integration Tests (All Endpoints & Spec Invariants)', () => {
  let app: any;
  let authorToken: string;
  let readerToken: string;

  beforeEach(async () => {
    const userRepository = new InMemoryUserRepository();
    const profileRepository = new InMemoryProfileRepository(userRepository);
    const articleRepository = new InMemoryArticleRepository(userRepository, profileRepository);

    process.env.JWT_SECRET = 'article-test-secret';
    const authService = new AuthService(userRepository, 'article-test-secret', '1h');
    const profileService = new ProfileService(profileRepository);
    const articleService = new ArticleService(articleRepository);

    app = createApp({
      userRepository,
      profileRepository,
      articleRepository,
      authService,
      profileService,
      articleService,
    });

    // Register Author
    const authorRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'authorUser',
          email: 'author@example.com',
          password: 'password123',
        },
      });
    authorToken = authorRes.body.user.token;

    // Register Reader
    const readerRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'readerUser',
          email: 'reader@example.com',
          password: 'password123',
        },
      });
    readerToken = readerRes.body.user.token;
  });

  describe('POST /api/articles (Creation)', () => {
    it('should create an article and return status 201 with body field', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'First Article',
            description: 'Article description',
            body: 'Article full content body',
            tagList: ['nodejs', 'express'],
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('article');
      expect(response.body.article.slug).toBe('first-article');
      expect(response.body.article.body).toBe('Article full content body');
      expect(response.body.article.author.username).toBe('authorUser');
    });

    it('should return 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'No Auth',
            description: 'desc',
            body: 'body',
          },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/articles (List — Performance Spec Invariant: body excluded)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'NodeJS Secrets',
            description: 'desc 1',
            body: 'Full long body 1',
            tagList: ['backend'],
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'React Patterns',
            description: 'desc 2',
            body: 'Full long body 2',
            tagList: ['frontend'],
          },
        });
    });

    it('should return articles list WITHOUT body property in any item', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(2);
      expect(response.body.articles.length).toBe(2);

      for (const article of response.body.articles) {
        expect(article.body).toBeUndefined();
        expect(article.title).toBeDefined();
        expect(article.slug).toBeDefined();
      }
    });

    it('should filter articles by tag', async () => {
      const response = await request(app).get('/api/articles?tag=backend');

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].slug).toBe('nodejs-secrets');
    });

    it('should paginate articles with limit and offset', async () => {
      const response = await request(app).get('/api/articles?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articlesCount).toBe(2);
    });
  });

  describe('GET /api/articles/feed (Feed — body excluded & auth required)', () => {
    beforeEach(async () => {
      // Reader follows author
      await request(app)
        .post('/api/profiles/authorUser/follow')
        .set('Authorization', `Token ${readerToken}`);

      // Author creates article
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Feed Story',
            description: 'feed desc',
            body: 'feed body text',
            tagList: ['news'],
          },
        });
    });

    it('should return articles in feed WITHOUT body field', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${readerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articlesCount).toBe(1);
      expect(response.body.articles[0].body).toBeUndefined();
      expect(response.body.articles[0].title).toBe('Feed Story');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get('/api/articles/feed');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/articles/:slug', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Detailed Article',
            description: 'detail desc',
            body: 'full detailed body content',
            tagList: ['detail'],
          },
        });
      slug = res.body.article.slug;
    });

    it('should return article WITH body field', async () => {
      const response = await request(app).get(`/api/articles/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body.article.body).toBe('full detailed body content');
      expect(response.body.article.slug).toBe(slug);
    });

    it('should return 404 for unknown slug', async () => {
      const response = await request(app).get('/api/articles/does-not-exist');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT & DELETE /api/articles/:slug (Author only)', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Editable Article',
            description: 'edit desc',
            body: 'edit body',
            tagList: [],
          },
        });
      slug = res.body.article.slug;
    });

    it('should allow author to update article', async () => {
      const response = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            description: 'Brand new description',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.article.description).toBe('Brand new description');
    });

    it('should forbid non-author from updating article (403)', async () => {
      const response = await request(app)
        .put(`/api/articles/${slug}`)
        .set('Authorization', `Token ${readerToken}`)
        .send({
          article: {
            description: 'Malicious modification',
          },
        });

      expect(response.status).toBe(403);
    });

    it('should forbid non-author from deleting article (403)', async () => {
      const response = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${readerToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow author to delete article (200)', async () => {
      const response = await request(app)
        .delete(`/api/articles/${slug}`)
        .set('Authorization', `Token ${authorToken}`);

      expect(response.status).toBe(200);

      const check = await request(app).get(`/api/articles/${slug}`);
      expect(check.status).toBe(404);
    });
  });

  describe('Favorite & Unfavorite endpoints', () => {
    let slug: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${authorToken}`)
        .send({
          article: {
            title: 'Likeable Article',
            description: 'desc',
            body: 'body',
            tagList: [],
          },
        });
      slug = res.body.article.slug;
    });

    it('should favorite an article and return favorited: true', async () => {
      const response = await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${readerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('should unfavorite an article and return favorited: false', async () => {
      await request(app)
        .post(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${readerToken}`);

      const response = await request(app)
        .delete(`/api/articles/${slug}/favorite`)
        .set('Authorization', `Token ${readerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });
});

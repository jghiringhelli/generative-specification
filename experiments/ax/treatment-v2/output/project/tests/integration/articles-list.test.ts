import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../helpers/testDb';

describe('Articles API - List and Feed', () => {
  let app: Application;
  let jakeToken: string;
  let janeToken: string;

  beforeAll(() => {
    app = createApp(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();

    const jakeResponse = await request(app).post('/api/users').send({
      user: { email: 'jake@jake.jake', username: 'jake', password: 'jakejake' },
    });
    jakeToken = jakeResponse.body.user.token;

    const janeResponse = await request(app).post('/api/users').send({
      user: { email: 'jane@jane.jane', username: 'jane', password: 'janejane' },
    });
    janeToken = janeResponse.body.user.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      // Create test articles
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
            tagList: ['dragons', 'training'],
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${janeToken}`)
        .send({
          article: {
            title: 'How to cook pasta',
            description: 'Cooking guide',
            body: 'Boil water first',
            tagList: ['cooking', 'pasta'],
          },
        });
    });

    it('listArticles_returns_all_articles_ordered_by_most_recent', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articlesCount).toBe(2);
      // Most recent first (pasta was created after dragon)
      expect(response.body.articles[0].title).toBe('How to cook pasta');
      expect(response.body.articles[1].title).toBe('How to train your dragon');
    });

    it('listArticles_does_not_include_body_field', async () => {
      const response = await request(app).get('/api/articles');

      expect(response.body.articles[0]).not.toHaveProperty('body');
      expect(response.body.articles[0]).toHaveProperty('title');
      expect(response.body.articles[0]).toHaveProperty('description');
    });

    it('listArticles_with_tag_filter_returns_matching_articles', async () => {
      const response = await request(app).get('/api/articles?tag=dragons');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('How to train your dragon');
    });

    it('listArticles_with_author_filter_returns_matching_articles', async () => {
      const response = await request(app).get('/api/articles?author=jake');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('How to train your dragon');
    });

    it('listArticles_with_favorited_filter_returns_matching_articles', async () => {
      // Jake favorites his own article
      await request(app)
        .post('/api/articles/how-to-train-your-dragon/favorite')
        .set('Authorization', `Token ${jakeToken}`);

      const response = await request(app).get('/api/articles?favorited=jake');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('How to train your dragon');
    });

    it('listArticles_with_limit_returns_limited_results', async () => {
      const response = await request(app).get('/api/articles?limit=1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(2); // Total count still 2
    });

    it('listArticles_with_offset_skips_results', async () => {
      const response = await request(app).get('/api/articles?offset=1');

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('How to train your dragon');
    });

    it('listArticles_with_auth_includes_favorited_status', async () => {
      await request(app)
        .post('/api/articles/how-to-train-your-dragon/favorite')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/articles')
        .set('Authorization', `Token ${janeToken}`);

      const dragonArticle = response.body.articles.find(
        (a: any) => a.slug === 'how-to-train-your-dragon'
      );
      expect(dragonArticle.favorited).toBe(true);

      const pastaArticle = response.body.articles.find((a: any) => a.slug === 'how-to-cook-pasta');
      expect(pastaArticle.favorited).toBe(false);
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      // Create articles from both users
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Jake article 1',
            description: 'By Jake',
            body: 'Content',
          },
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${janeToken}`)
        .send({
          article: {
            title: 'Jane article 1',
            description: 'By Jane',
            body: 'Content',
          },
        });
    });

    it('getFeed_returns_articles_from_followed_users_only', async () => {
      // Jane follows jake
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].title).toBe('Jake article 1');
      expect(response.body.articles[0].author.username).toBe('jake');
    });

    it('getFeed_without_auth_returns_401', async () => {
      const response = await request(app).get('/api/articles/feed');

      expect(response.status).toBe(401);
    });

    it('getFeed_with_no_followed_users_returns_empty_array', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toEqual([]);
      expect(response.body.articlesCount).toBe(0);
    });

    it('getFeed_does_not_include_body_field', async () => {
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.body.articles[0]).not.toHaveProperty('body');
    });

    it('getFeed_respects_limit_and_offset', async () => {
      // Create multiple articles from jake
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: { title: 'Jake article 2', description: 'Test', body: 'Test' },
        });

      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/articles/feed?limit=1&offset=1')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articlesCount).toBe(2);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
          },
        });
    });

    it('favoriteArticle_returns_200_with_favorited_true', async () => {
      const response = await request(app)
        .post('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('favoriteArticle_without_auth_returns_401', async () => {
      const response = await request(app).post('/api/articles/test-article/favorite');

      expect(response.status).toBe(401);
    });

    it('favoriteArticle_with_nonexistent_slug_returns_404', async () => {
      const response = await request(app)
        .post('/api/articles/nonexistent/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(404);
    });

    it('favoriteArticle_is_idempotent', async () => {
      await request(app)
        .post('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .post('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favoritesCount).toBe(1);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
          },
        });

      await request(app)
        .post('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);
    });

    it('unfavoriteArticle_returns_200_with_favorited_false', async () => {
      const response = await request(app)
        .delete('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('unfavoriteArticle_without_auth_returns_401', async () => {
      const response = await request(app).delete('/api/articles/test-article/favorite');

      expect(response.status).toBe(401);
    });

    it('unfavoriteArticle_with_nonexistent_slug_returns_404', async () => {
      const response = await request(app)
        .delete('/api/articles/nonexistent/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(404);
    });

    it('unfavoriteArticle_is_idempotent', async () => {
      await request(app)
        .delete('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .delete('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.article.favoritesCount).toBe(0);
    });
  });
});

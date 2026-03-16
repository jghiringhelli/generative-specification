import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { cleanDatabase, disconnectDatabase, prisma } from '../helpers/testDb';

describe('Articles API', () => {
  let app: Application;
  let jakeToken: string;
  let janeToken: string;
  let jakeUserId: number;

  beforeAll(() => {
    app = createApp(prisma);
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users
    const jakeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jake@jake.jake',
        username: 'jake',
        password: 'jakejake',
      },
    });
    jakeToken = jakeResponse.body.user.token;

    const janeResponse = await request(app).post('/api/users').send({
      user: {
        email: 'jane@jane.jane',
        username: 'jane',
        password: 'janejane',
      },
    });
    janeToken = janeResponse.body.user.token;

    // Get jake's user ID from database
    const jakeUser = await prisma.user.findUnique({ where: { username: 'jake' } });
    jakeUserId = jakeUser!.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /api/articles', () => {
    it('createArticle_with_valid_data_returns_201_and_article', async () => {
      const response = await request(app)
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

      expect(response.status).toBe(201);
      expect(response.body.article).toMatchObject({
        slug: 'how-to-train-your-dragon',
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons', 'training'],
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'jake',
          following: false,
        },
      });
      expect(response.body.article.createdAt).toBeDefined();
      expect(response.body.article.updatedAt).toBeDefined();
    });

    it('createArticle_without_auth_returns_401', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test',
            description: 'Test',
            body: 'Test',
          },
        });

      expect(response.status).toBe(401);
    });

    it('createArticle_with_missing_title_returns_422', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            description: 'Test',
            body: 'Test',
          },
        });

      expect(response.status).toBe(422);
    });

    it('createArticle_generates_unique_slug_on_collision', async () => {
      // Create first article
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'First',
            body: 'First',
          },
        });

      // Create second article with same title
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Second',
            body: 'Second',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.article.slug).not.toBe('how-to-train-your-dragon');
      expect(response.body.article.slug).toMatch(/^how-to-train-your-dragon-/);
    });

    it('createArticle_without_tags_creates_article_with_empty_tagList', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Test article',
            description: 'Test',
            body: 'Test',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.article.tagList).toEqual([]);
    });
  });

  describe('GET /api/articles/:slug', () => {
    beforeEach(async () => {
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
    });

    it('getArticle_with_valid_slug_returns_200_and_article', async () => {
      const response = await request(app).get('/api/articles/how-to-train-your-dragon');

      expect(response.status).toBe(200);
      expect(response.body.article).toMatchObject({
        slug: 'how-to-train-your-dragon',
        title: 'How to train your dragon',
        body: 'It takes a Jacobian',
      });
    });

    it('getArticle_with_nonexistent_slug_returns_404', async () => {
      const response = await request(app).get('/api/articles/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Article not found');
    });

    it('getArticle_includes_author_profile', async () => {
      const response = await request(app).get('/api/articles/how-to-train-your-dragon');

      expect(response.body.article.author).toMatchObject({
        username: 'jake',
        bio: null,
        image: null,
        following: false,
      });
    });

    it('getArticle_with_auth_shows_following_status', async () => {
      // Jane follows jake
      await request(app)
        .post('/api/profiles/jake/follow')
        .set('Authorization', `Token ${janeToken}`);

      const response = await request(app)
        .get('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.body.article.author.following).toBe(true);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
          },
        });
    });

    it('updateArticle_by_author_returns_200_and_updated_article', async () => {
      const response = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Did you train your dragon?',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.article.title).toBe('Did you train your dragon?');
      expect(response.body.article.slug).toBe('did-you-train-your-dragon');
    });

    it('updateArticle_by_non_author_returns_403', async () => {
      const response = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${janeToken}`)
        .send({
          article: {
            title: 'Hacked',
          },
        });

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain('only author can update article');
    });

    it('updateArticle_without_auth_returns_401', async () => {
      const response = await request(app)
        .put('/api/articles/how-to-train-your-dragon')
        .send({
          article: {
            title: 'Test',
          },
        });

      expect(response.status).toBe(401);
    });

    it('updateArticle_with_nonexistent_slug_returns_404', async () => {
      const response = await request(app)
        .put('/api/articles/nonexistent')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'Test',
          },
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${jakeToken}`)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'It takes a Jacobian',
          },
        });
    });

    it('deleteArticle_by_author_returns_200', async () => {
      const response = await request(app)
        .delete('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${jakeToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app).get('/api/articles/how-to-train-your-dragon');
      expect(getResponse.status).toBe(404);
    });

    it('deleteArticle_by_non_author_returns_403', async () => {
      const response = await request(app)
        .delete('/api/articles/how-to-train-your-dragon')
        .set('Authorization', `Token ${janeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.errors.body).toContain('only author can delete article');
    });

    it('deleteArticle_without_auth_returns_401', async () => {
      const response = await request(app).delete('/api/articles/how-to-train-your-dragon');

      expect(response.status).toBe(401);
    });

    it('deleteArticle_with_nonexistent_slug_returns_404', async () => {
      const response = await request(app)
        .delete('/api/articles/nonexistent')
        .set('Authorization', `Token ${jakeToken}`);

      expect(response.status).toBe(404);
    });
  });
});

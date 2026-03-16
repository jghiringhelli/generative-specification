import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Article Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;
  let userToken: string;
  let user2Token: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.userFavorite.deleteMany();
    await prisma.userFollow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user1@example.com',
          username: 'user1',
          password: 'password123'
        }
      });
    userToken = userResponse.body.user.token;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'user2',
          password: 'password123'
        }
      });
    user2Token = user2Response.body.user.token;
  });

  describe('POST /api/articles', () => {
    it('create_article_with_valid_data_returns_201_and_article', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            tagList: ['testing', 'nodejs']
          }
        })
        .expect(201);

      expect(response.body.article).toMatchObject({
        slug: 'test-article',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: expect.arrayContaining(['testing', 'nodejs']),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'user1',
          following: false
        }
      });
      expect(response.body.article.createdAt).toBeDefined();
      expect(response.body.article.updatedAt).toBeDefined();
    });

    it('create_article_without_tags_succeeds', async () => {
      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'No Tags Article',
            description: 'Description',
            body: 'Body'
          }
        })
        .expect(201);

      expect(response.body.article.tagList).toEqual([]);
    });

    it('create_article_without_auth_returns_401', async () => {
      await request(app)
        .post('/api/articles')
        .send({
          article: {
            title: 'Test',
            description: 'Test',
            body: 'Test'
          }
        })
        .expect(401);
    });

    it('create_article_with_missing_title_returns_422', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            description: 'Test',
            body: 'Test'
          }
        })
        .expect(422);
    });

    it('create_article_with_duplicate_title_generates_unique_slug', async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Duplicate Title',
            description: 'First',
            body: 'First'
          }
        })
        .expect(201);

      const response = await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Duplicate Title',
            description: 'Second',
            body: 'Second'
          }
        })
        .expect(201);

      expect(response.body.article.slug).toBe('duplicate-title-2');
    });
  });

  describe('GET /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Test Article',
            description: 'Description',
            body: 'Body content',
            tagList: ['test']
          }
        });
    });

    it('get_existing_article_returns_200_and_full_article', async () => {
      const response = await request(app)
        .get('/api/articles/test-article')
        .expect(200);

      expect(response.body.article).toMatchObject({
        slug: 'test-article',
        title: 'Test Article',
        body: 'Body content',
        author: {
          username: 'user1'
        }
      });
    });

    it('get_nonexistent_article_returns_404', async () => {
      await request(app).get('/api/articles/nonexistent').expect(404);
    });

    it('get_article_with_auth_shows_favorited_status', async () => {
      await request(app)
        .post('/api/articles/test-article/favorite')
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/articles/test-article')
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      expect(response.body.article.favorited).toBe(true);
    });
  });

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      // Create multiple articles
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Article 1',
            description: 'Desc 1',
            body: 'Body 1',
            tagList: ['tag1']
          }
        });

      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Article 2',
            description: 'Desc 2',
            body: 'Body 2',
            tagList: ['tag2']
          }
        });
    });

    it('list_articles_returns_200_and_articles_without_body_field', async () => {
      const response = await request(app).get('/api/articles').expect(200);

      expect(response.body.articles).toHaveLength(2);
      expect(response.body.articles[0].body).toBeUndefined();
      expect(response.body.articles[0].title).toBeDefined();
      expect(response.body.articlesCount).toBe(2);
    });

    it('list_articles_with_tag_filter_returns_filtered_results', async () => {
      const response = await request(app)
        .get('/api/articles?tag=tag1')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].tagList).toContain('tag1');
    });

    it('list_articles_with_author_filter_returns_filtered_results', async () => {
      const response = await request(app)
        .get('/api/articles?author=user1')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].author.username).toBe('user1');
    });

    it('list_articles_with_limit_pagination_returns_limited_results', async () => {
      const response = await request(app)
        .get('/api/articles?limit=1')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
    });

    it('list_articles_with_offset_pagination_returns_offset_results', async () => {
      const response = await request(app)
        .get('/api/articles?offset=1')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
    });

    it('list_articles_with_favorited_filter_returns_filtered_results', async () => {
      await request(app)
        .post('/api/articles/article-1/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      const response = await request(app)
        .get('/api/articles?favorited=user2')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].slug).toBe('article-1');
    });
  });

  describe('GET /api/articles/feed', () => {
    beforeEach(async () => {
      // User1 follows User2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      // User2 creates article
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Feed Article',
            description: 'From followed user',
            body: 'Content'
          }
        });
    });

    it('get_feed_returns_articles_from_followed_users_without_body_field', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
      expect(response.body.articles[0].author.username).toBe('user2');
      expect(response.body.articles[0].body).toBeUndefined();
    });

    it('get_feed_without_auth_returns_401', async () => {
      await request(app).get('/api/articles/feed').expect(401);
    });

    it('get_feed_with_no_follows_returns_empty_list', async () => {
      const response = await request(app)
        .get('/api/articles/feed')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.articles).toHaveLength(0);
    });
  });

  describe('PUT /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Original Title',
            description: 'Original description',
            body: 'Original body'
          }
        });
    });

    it('update_article_by_author_returns_200_and_updated_article', async () => {
      const response = await request(app)
        .put('/api/articles/original-title')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Updated Title',
            description: 'Updated description'
          }
        })
        .expect(200);

      expect(response.body.article).toMatchObject({
        slug: 'updated-title',
        title: 'Updated Title',
        description: 'Updated description',
        body: 'Original body'
      });
    });

    it('update_article_by_non_author_returns_403', async () => {
      await request(app)
        .put('/api/articles/original-title')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          article: {
            title: 'Hacked'
          }
        })
        .expect(403);
    });

    it('update_article_without_auth_returns_401', async () => {
      await request(app)
        .put('/api/articles/original-title')
        .send({
          article: {
            title: 'Hacked'
          }
        })
        .expect(401);
    });

    it('update_nonexistent_article_returns_404', async () => {
      await request(app)
        .put('/api/articles/nonexistent')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Updated'
          }
        })
        .expect(404);
    });
  });

  describe('DELETE /api/articles/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'To Delete',
            description: 'Description',
            body: 'Body'
          }
        });
    });

    it('delete_article_by_author_returns_200', async () => {
      await request(app)
        .delete('/api/articles/to-delete')
        .set('Authorization', `Token ${userToken}`)
        .expect(200);

      await request(app).get('/api/articles/to-delete').expect(404);
    });

    it('delete_article_by_non_author_returns_403', async () => {
      await request(app)
        .delete('/api/articles/to-delete')
        .set('Authorization', `Token ${user2Token}`)
        .expect(403);
    });

    it('delete_article_without_auth_returns_401', async () => {
      await request(app).delete('/api/articles/to-delete').expect(401);
    });
  });

  describe('POST /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'To Favorite',
            description: 'Description',
            body: 'Body'
          }
        });
    });

    it('favorite_article_returns_200_with_favorited_true', async () => {
      const response = await request(app)
        .post('/api/articles/to-favorite/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.article.favorited).toBe(true);
      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('favorite_article_twice_is_idempotent', async () => {
      await request(app)
        .post('/api/articles/to-favorite/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      const response = await request(app)
        .post('/api/articles/to-favorite/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.article.favoritesCount).toBe(1);
    });

    it('favorite_article_without_auth_returns_401', async () => {
      await request(app)
        .post('/api/articles/to-favorite/favorite')
        .expect(401);
    });

    it('favorite_nonexistent_article_returns_404', async () => {
      await request(app)
        .post('/api/articles/nonexistent/favorite')
        .set('Authorization', `Token ${userToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/articles/:slug/favorite', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/articles')
        .set('Authorization', `Token ${userToken}`)
        .send({
          article: {
            title: 'Favorited Article',
            description: 'Description',
            body: 'Body'
          }
        });

      await request(app)
        .post('/api/articles/favorited-article/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);
    });

    it('unfavorite_article_returns_200_with_favorited_false', async () => {
      const response = await request(app)
        .delete('/api/articles/favorited-article/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.article.favorited).toBe(false);
      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('unfavorite_article_twice_is_idempotent', async () => {
      await request(app)
        .delete('/api/articles/favorited-article/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      const response = await request(app)
        .delete('/api/articles/favorited-article/favorite')
        .set('Authorization', `Token ${user2Token}`)
        .expect(200);

      expect(response.body.article.favoritesCount).toBe(0);
    });

    it('unfavorite_article_without_auth_returns_401', async () => {
      await request(app)
        .delete('/api/articles/favorited-article/favorite')
        .expect(401);
    });
  });
});

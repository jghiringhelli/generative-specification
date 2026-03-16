
/**
 * End-to-end integration tests.
 * Verifies complete user journeys across multiple features.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import type { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
});

beforeEach(async () => {
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Complete User Journey', () => {
  it('supports full social blogging workflow', async () => {
    // 1. Two users register
    const alice = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'alice@example.com',
          username: 'alice',
          password: 'password123'
        }
      })
      .expect(201);

    const bob = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'bob@example.com',
          username: 'bob',
          password: 'password123'
        }
      })
      .expect(201);

    const aliceToken = alice.body.user.token;
    const bobToken = bob.body.user.token;

    // 2. Alice updates her profile
    await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${aliceToken}`)
      .send({
        user: {
          bio: 'I love writing about technology',
          image: 'https://example.com/alice.jpg'
        }
      })
      .expect(200);

    // 3. Bob follows Alice
    const followResponse = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(followResponse.body.profile.following).toBe(true);

    // 4. Alice creates an article with tags
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${aliceToken}`)
      .send({
        article: {
          title: 'How to Build Great APIs',
          description: 'A comprehensive guide',
          body: 'Start with good design principles...',
          tagList: ['api', 'design', 'best-practices']
        }
      })
      .expect(201);

    const articleSlug = articleResponse.body.article.slug;

    // 5. Bob sees Alice's article in his feed
    const feedResponse = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(feedResponse.body.articles).toHaveLength(1);
    expect(feedResponse.body.articles[0].slug).toBe(articleSlug);
    expect(feedResponse.body.articles[0].author.username).toBe('alice');
    expect(feedResponse.body.articles[0].author.following).toBe(true);
    // Body field should NOT be in feed
    expect(feedResponse.body.articles[0]).not.toHaveProperty('body');

    // 6. Bob favorites the article
    const favoriteResponse = await request(app)
      .post(`/api/articles/${articleSlug}/favorite`)
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(favoriteResponse.body.article.favorited).toBe(true);
    expect(favoriteResponse.body.article.favoritesCount).toBe(1);

    // 7. Bob adds a comment
    const commentResponse = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${bobToken}`)
      .send({
        comment: { body: 'Great article, Alice!' }
      })
      .expect(201);

    expect(commentResponse.body.comment.author.username).toBe('bob');

    // 8. Alice sees the comment with Bob's following status
    const commentsResponse = await request(app)
      .get(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${aliceToken}`)
      .expect(200);

    expect(commentsResponse.body.comments).toHaveLength(1);
    expect(commentsResponse.body.comments[0].body).toBe('Great article, Alice!');
    expect(commentsResponse.body.comments[0].author.following).toBe(false); // Alice doesn't follow Bob

    // 9. Get article by slug (includes body field)
    const articleDetailResponse = await request(app)
      .get(`/api/articles/${articleSlug}`)
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(articleDetailResponse.body.article.body).toBe('Start with good design principles...');
    expect(articleDetailResponse.body.article.favorited).toBe(true);

    // 10. List articles filtered by tag
    const tagFilterResponse = await request(app)
      .get('/api/articles?tag=api')
      .expect(200);

    expect(tagFilterResponse.body.articles).toHaveLength(1);
    expect(tagFilterResponse.body.articles[0].tagList).toContain('api');

    // 11. Get all tags
    const tagsResponse = await request(app).get('/api/tags').expect(200);

    expect(tagsResponse.body.tags).toEqual(
      expect.arrayContaining(['api', 'design', 'best-practices'])
    );

    // 12. Alice updates her article
    await request(app)
      .put(`/api/articles/${articleSlug}`)
      .set('Authorization', `Token ${aliceToken}`)
      .send({
        article: {
          description: 'An updated comprehensive guide'
        }
      })
      .expect(200);

    // 13. Bob tries to update Alice's article (should fail)
    await request(app)
      .put(`/api/articles/${articleSlug}`)
      .set('Authorization', `Token ${bobToken}`)
      .send({
        article: { title: 'Hacked' }
      })
      .expect(403);

    // 14. Bob unfavorites the article
    const unfavoriteResponse = await request(app)
      .delete(`/api/articles/${articleSlug}/favorite`)
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(unfavoriteResponse.body.article.favorited).toBe(false);
    expect(unfavoriteResponse.body.article.favoritesCount).toBe(0);

    // 15. Bob deletes his comment
    const commentId = commentResponse.body.comment.id;
    await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    // Verify comment deleted
    const commentsAfterDelete = await request(app)
      .get(`/api/articles/${articleSlug}/comments`)
      .expect(200);

    expect(commentsAfterDelete.body.comments).toHaveLength(0);

    // 16. Bob unfollows Alice
    const unfollowResponse = await request(app)
      .delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(unfollowResponse.body.profile.following).toBe(false);

    // 17. Bob's feed is now empty
    const emptyFeedResponse = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${bobToken}`)
      .expect(200);

    expect(emptyFeedResponse.body.articles).toHaveLength(0);

    // 18. Alice deletes her article
    await request(app)
      .delete(`/api/articles/${articleSlug}`)
      .set('Authorization', `Token ${aliceToken}`)
      .expect(200);

    // Verify article deleted
    await request(app).get(`/api/articles/${articleSlug}`).expect(404);
  });

  it('enforces authentication boundaries correctly', async () => {
    // Create user and article
    const user = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'test', password: 'password123' }
    });
    const token = user.body.user.token;

    const article = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Test', description: 'Desc', body: 'Body', tagList: [] }
      });
    const slug = article.body.article.slug;

    // Public endpoints (no auth required)
    await request(app).get('/api/tags').expect(200);
    await request(app).get('/api/articles').expect(200);
    await request(app).get(`/api/articles/${slug}`).expect(200);
    await request(app).get(`/api/articles/${slug}/comments`).expect(200);
    await request(app).get('/api/profiles/test').expect(200);

    // Protected endpoints (401 without auth)
    await request(app).get('/api/user').expect(401);
    await request(app).put('/api/user').send({ user: {} }).expect(401);
    await request(app).get('/api/articles/feed').expect(401);
    await request(app).post('/api/articles').send({ article: {} }).expect(401);
    await request(app).put(`/api/articles/${slug}`).send({ article: {} }).expect(401);
    await request(app).delete(`/api/articles/${slug}`).expect(401);
    await request(app).post(`/api/articles/${slug}/favorite`).expect(401);
    await request(app).delete(`/api/articles/${slug}/favorite`).expect(401);
    await request(app).post(`/api/articles/${slug}/comments`).send({ comment: {} }).expect(401);
    await request(app).delete(`/api/articles/${slug}/comments/1`).expect(401);
    await request(app).post('/api/profiles/test/follow').expect(401);
    await request(app).delete('/api/profiles/test/follow').expect(401);
  });

  it('validates all error response formats', async () => {
    // 422 validation errors
    const validationError = await request(app)
      .post('/api/users')
      .send({ user: { email: 'invalid', username: 'test' } })
      .expect(422);
    expect(validationError.body).toEqual({
      errors: { body: [expect.any(String)] }
    });

    // 401 unauthorized
    const unauthorizedError = await request(app).get('/api/user').expect(401);
    expect(unauthorizedError.body).toEqual({
      errors: { body: ['missing authorization token'] }
    });

    // 404 not found
    const notFoundError = await request(app).get('/api/articles/nonexistent').expect(404);
    expect(notFoundError.body).toEqual({
      errors: { body: [expect.stringContaining('not found')] }
    });

    // Create user and article for 403 test
    const user1 = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2 = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const article = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1.body.user.token}`)
      .send({
        article: { title: 'Test', description: 'Desc', body: 'Body', tagList: [] }
      });

    // 403 forbidden
    const forbiddenError = await request(app)
      .delete(`/api/articles/${article.body.article.slug}`)
      .set('Authorization', `Token ${user2.body.user.token}`)
      .expect(403);
    expect(forbiddenError.body).toEqual({
      errors: { body: [expect.stringContaining('author')] }
    });

    // 409 conflict
    await request(app).post('/api/users').send({
      user: { email: 'unique@example.com', username: 'unique', password: 'password123' }
    });
    const conflictError = await request(app)
      .post('/api/users')
      .send({
        user: { email: 'unique@example.com', username: 'different', password: 'password123' }
      })
      .expect(422);
    expect(conflictError.body).toEqual({
      errors: { body: ['email already taken'] }
    });
  });
});

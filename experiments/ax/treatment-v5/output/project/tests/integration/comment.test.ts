
/**
 * Integration tests for comment endpoints.
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

describe('GET /api/articles/:slug/comments', () => {
  it('returns list of comments for article', async () => {
    // Create user and article
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Test Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    // Add comment
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: { body: 'Great article!' }
      });

    // Get comments
    const response = await request(app).get(`/api/articles/${slug}/comments`).expect(200);

    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0]).toMatchObject({
      body: 'Great article!',
      author: {
        username: 'testuser',
        bio: null,
        image: null,
        following: false
      }
    });
    expect(response.body.comments[0].id).toBeDefined();
    expect(response.body.comments[0].createdAt).toBeDefined();
  });

  it('returns empty list when article has no comments', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Test Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    const response = await request(app).get(`/api/articles/${slug}/comments`).expect(200);

    expect(response.body.comments).toEqual([]);
  });

  it('returns 404 when article does not exist', async () => {
    const response = await request(app).get('/api/articles/nonexistent/comments').expect(404);

    expect(response.body).toEqual({
      errors: { body: ["Article with identifier 'nonexistent' not found"] }
    });
  });

  it('shows following status when authenticated user follows comment author', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const token1 = user1Response.body.user.token;
    const token2 = user2Response.body.user.token;

    // User1 follows user2
    await request(app).post('/api/profiles/user2/follow').set('Authorization', `Token ${token1}`);

    // User1 creates article
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token1}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    // User2 comments
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token2}`)
      .send({
        comment: { body: 'Nice work!' }
      });

    // User1 gets comments
    const response = await request(app)
      .get(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token1}`)
      .expect(200);

    expect(response.body.comments[0].author.following).toBe(true);
  });
});

describe('POST /api/articles/:slug/comments', () => {
  it('creates comment and returns it', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Test Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: { body: 'This is a comment' }
      })
      .expect(201);

    expect(response.body.comment).toMatchObject({
      body: 'This is a comment',
      author: {
        username: 'testuser',
        bio: null,
        image: null,
        following: false
      }
    });
    expect(response.body.comment.id).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/api/articles/test-slug/comments')
      .send({
        comment: { body: 'Comment' }
      })
      .expect(401);

    expect(response.body).toEqual({
      errors: { body: ['missing authorization token'] }
    });
  });

  it('returns 422 when body is missing', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: {}
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: { body: ["body can't be blank"] }
    });
  });

  it('returns 404 when article does not exist', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const response = await request(app)
      .post('/api/articles/nonexistent/comments')
      .set('Authorization', `Token ${token}`)
      .send({
        comment: { body: 'Comment' }
      })
      .expect(404);

    expect(response.body).toEqual({
      errors: { body: ["Article with identifier 'nonexistent' not found"] }
    });
  });
});

describe('DELETE /api/articles/:slug/comments/:id', () => {
  it('deletes comment when user is author', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    const commentResponse = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({
        comment: { body: 'To be deleted' }
      });

    const commentId = commentResponse.body.comment.id;

    await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Verify deleted
    const getResponse = await request(app).get(`/api/articles/${slug}/comments`).expect(200);

    expect(getResponse.body.comments).toHaveLength(0);
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .delete('/api/articles/test-slug/comments/1')
      .expect(401);

    expect(response.body).toEqual({
      errors: { body: ['missing authorization token'] }
    });
  });

  it('returns 404 when comment does not exist', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: { email: 'test@example.com', username: 'testuser', password: 'password123' }
    });
    const token = userResponse.body.user.token;

    const response = await request(app)
      .delete('/api/articles/test-slug/comments/999')
      .set('Authorization', `Token ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      errors: { body: ['Comment with identifier \'999\' not found'] }
    });
  });

  it('returns 403 when user is not comment author', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: { email: 'user1@example.com', username: 'user1', password: 'password123' }
    });
    const user2Response = await request(app).post('/api/users').send({
      user: { email: 'user2@example.com', username: 'user2', password: 'password123' }
    });

    const token1 = user1Response.body.user.token;
    const token2 = user2Response.body.user.token;

    // User1 creates article
    const articleResponse = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token1}`)
      .send({
        article: { title: 'Article', description: 'Desc', body: 'Body', tagList: [] }
      });

    const slug = articleResponse.body.article.slug;

    // User1 adds comment
    const commentResponse = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token1}`)
      .send({
        comment: { body: 'User1 comment' }
      });

    const commentId = commentResponse.body.comment.id;

    // User2 tries to delete user1's comment
    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token2}`)
      .expect(403);

    expect(response.body).toEqual({
      errors: { body: ['Only the author can delete this comment'] }
    });
  });
});

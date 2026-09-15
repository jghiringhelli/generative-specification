import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';

describe('Comments Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let articleSlug: string;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    const u1 = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'author',
          email: 'author@example.com',
          password: 'password123'
        }
      });
    user1Token = u1.body.user.token;

    const u2 = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'commenter',
          email: 'commenter@example.com',
          password: 'password123'
        }
      });
    user2Token = u2.body.user.token;

    const art = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${user1Token}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'A test article',
          body: 'Content'
        }
      });
    articleSlug = art.body.article.slug;
  });

  afterAll(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('lists comments for an article without authentication', async () => {
    await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: 'Great article!'
        }
      });

    const res = await request(app).get(`/api/articles/${articleSlug}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].body).toBe('Great article!');
    expect(res.body.comments[0].author.username).toBe('commenter');
  });

  it('adds a comment successfully to an article when authenticated', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: 'This is my feedback.'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.body).toBe('This is my feedback.');
    expect(res.body.comment.id).toBeDefined();
    expect(res.body.comment.author.username).toBe('commenter');
  });

  it('deletes own comment successfully', async () => {
    const addRes = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: 'Comment to be deleted'
        }
      });

    const commentId = addRes.body.comment.id;

    const deleteRes = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${user2Token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
    expect(listRes.body.comments).toHaveLength(0);
  });

  it('returns 403 when attempting to delete another user comment', async () => {
    const addRes = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: 'Comment by commenter'
        }
      });

    const commentId = addRes.body.comment.id;

    const deleteRes = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${user1Token}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.errors.body).toContain('You are not authorized to delete this comment');
  });

  it('returns 401 when adding comment without authentication', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .send({
        comment: {
          body: 'Unauthenticated comment'
        }
      });

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 404 when commenting on a non-existent article slug', async () => {
    const res = await request(app)
      .post('/api/articles/non-existent-article-slug/comments')
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: 'Hello nowhere'
        }
      });

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain("Article with slug 'non-existent-article-slug' not found");
  });

  it('returns 401 when deleting comment without authentication', async () => {
    const res = await request(app).delete(`/api/articles/${articleSlug}/comments/1`);

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 404 when deleting a comment that does not exist', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/99999`)
      .set('Authorization', `Token ${user1Token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 422 when adding a comment with an empty body', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${user2Token}`)
      .send({
        comment: {
          body: ''
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});
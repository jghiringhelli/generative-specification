import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Comment Endpoints Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  let authorToken: string;
  let commenterToken: string;
  let otherUserToken: string;
  let articleSlug: string;

  beforeEach(async () => {
    await clearDatabase(prisma);

    const aRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'articleauthor', email: 'author@example.com', password: 'password123' } });
    authorToken = aRes.body.user.token;

    const cRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'commenter', email: 'commenter@example.com', password: 'password123' } });
    commenterToken = cRes.body.user.token;

    const oRes = await request(app)
      .post('/api/users')
      .send({ user: { username: 'stranger', email: 'stranger@example.com', password: 'password123' } });
    otherUserToken = oRes.body.user.token;

    const artRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: 'Article for Comments',
          description: 'Testing comment endpoints',
          body: 'Article text',
        },
      });
    articleSlug = artRes.body.article.slug;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('lists comments for an article without authentication', async () => {
    await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: 'Public visible comment' },
      });

    const res = await request(app).get(`/api/articles/${articleSlug}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.comments).toBeDefined();
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].body).toBe('Public visible comment');
    expect(res.body.comments[0].author.username).toBe('commenter');
  });

  it('adds comment to an article successfully when authenticated', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: 'Great article on testing!' },
      });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.body).toBe('Great article on testing!');
    expect(res.body.comment.author.username).toBe('commenter');
  });

  it('deletes own comment successfully when authenticated', async () => {
    const addRes = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: 'Comment to be removed' },
      });

    const commentId = addRes.body.comment.id;

    const delRes = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${commenterToken}`);

    expect(delRes.status).toBe(200);

    const listRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
    expect(listRes.body.comments.length).toBe(0);
  });

  it("returns 403 when trying to delete another user's comment", async () => {
    const addRes = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: 'Protected comment' },
      });

    const commentId = addRes.body.comment.id;

    const delRes = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${otherUserToken}`);

    expect(delRes.status).toBe(403);
    expect(delRes.body.errors.body).toBeDefined();
  });

  it('returns 401 when adding a comment without authentication', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .send({
        comment: { body: 'Unauthorized comment' },
      });

    expect(res.status).toBe(401);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 404 when adding a comment to non-existent article', async () => {
    const res = await request(app)
      .post('/api/articles/non-existent-article-slug-xyz/comments')
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: 'Comment on nothing' },
      });

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 404 when deleting non-existent comment', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/9999`)
      .set('Authorization', `Token ${commenterToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 422 when adding a comment with empty body', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: { body: '' },
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.body).toBeDefined();
  });
});

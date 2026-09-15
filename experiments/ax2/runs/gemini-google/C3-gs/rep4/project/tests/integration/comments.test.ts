import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Comments Integration Tests', () => {
  const prefix = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const authorData = {
    username: `${prefix}_author`,
    email: `${prefix}_author@example.com`,
    password: 'password123'
  };
  const commenterData = {
    username: `${prefix}_commenter`,
    email: `${prefix}_commenter@example.com`,
    password: 'password123'
  };

  let authorToken: string;
  let commenterToken: string;
  let articleSlug: string;
  let commentId: string;

  beforeAll(async () => {
    //
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: prefix } }
      });
    } catch {
      //
    }
  });

  it('sets up author, article, and commenter', async () => {
    const resAuthor = await request(app).post('/api/users').send({ user: authorData });
    expect(resAuthor.status).toBe(201);
    authorToken = resAuthor.body.user.token;

    const resCommenter = await request(app).post('/api/users').send({ user: commenterData });
    expect(resCommenter.status).toBe(201);
    commenterToken = resCommenter.body.user.token;

    const resArticle = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          title: `${prefix} Article For Comments`,
          description: 'Desc',
          body: 'Body',
          tagList: ['comment-test']
        }
      });
    expect(resArticle.status).toBe(201);
    articleSlug = resArticle.body.article.slug;
  });

  it('POST /api/articles/:slug/comments - requires authentication', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .send({ comment: { body: 'Unauthorized comment' } });

    expect(res.status).toBe(401);
  });

  it('POST /api/articles/:slug/comments - adds a comment', async () => {
    const res = await request(app)
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({ comment: { body: 'Wonderful post!' } });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('comment');
    expect(res.body.comment.body).toBe('Wonderful post!');
    expect(res.body.comment.author.username).toBe(commenterData.username);
    commentId = res.body.comment.id;
  });

  it('GET /api/articles/:slug/comments - returns comments list', async () => {
    const res = await request(app).get(`/api/articles/${articleSlug}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('comments');
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
    expect(res.body.comments[0].body).toBe('Wonderful post!');
  });

  it('DELETE /api/articles/:slug/comments/:id - forbids non-author from deleting', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${authorToken}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /api/articles/:slug/comments/:id - deletes comment when called by author', async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${commenterToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/articles/${articleSlug}/comments`);
    expect(getRes.body.comments.some((c: any) => c.id === commentId)).toBe(false);
  });
});

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

describe('Comments Endpoints', () => {
  let author: any;
  let commenter: any;
  let commenterToken: string;
  let article: any;
  let commentId: number;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['cauthor@example.com', 'commenter@example.com'] }
      }
    });

    author = await prisma.user.create({
      data: {
        username: 'comment_author',
        email: 'cauthor@example.com',
        password: 'password123'
      }
    });

    commenter = await prisma.user.create({
      data: {
        username: 'commenter_user',
        email: 'commenter@example.com',
        password: 'password123'
      }
    });

    commenterToken = generateToken({
      userId: commenter.id,
      email: commenter.email,
      username: commenter.username
    });

    article = await prisma.article.create({
      data: {
        slug: 'article-for-comments',
        title: 'Article for comments',
        description: 'Testing comments',
        body: 'Comment body here',
        authorId: author.id
      }
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['cauthor@example.com', 'commenter@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  it('POST /api/articles/:slug/comments - should add a comment', async () => {
    const res = await request(app)
      .post(`/api/articles/${article.slug}/comments`)
      .set('Authorization', `Token ${commenterToken}`)
      .send({
        comment: {
          body: 'Great article!'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.body).toBe('Great article!');
    expect(res.body.comment.author.username).toBe(commenter.username);
    commentId = res.body.comment.id;
  });

  it('GET /api/articles/:slug/comments - should get comments for article', async () => {
    const res = await request(app).get(`/api/articles/${article.slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
    expect(res.body.comments[0].body).toBe('Great article!');
  });

  it('DELETE /api/articles/:slug/comments/:id - should delete own comment', async () => {
    const res = await request(app)
      .delete(`/api/articles/${article.slug}/comments/${commentId}`)
      .set('Authorization', `Token ${commenterToken}`);

    expect(res.status).toBe(200);

    const checkRes = await request(app).get(`/api/articles/${article.slug}/comments`);
    expect(checkRes.body.comments.length).toBe(0);
  });
});

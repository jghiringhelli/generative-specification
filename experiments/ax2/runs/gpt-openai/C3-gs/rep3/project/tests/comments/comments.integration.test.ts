import request from 'supertest';
import { ArticleService } from '../../src/articles/ArticleService';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/auth/AuthService';
import { CommentService } from '../../src/comments/CommentService';
import { InMemoryArticleRepository } from '../fixtures/InMemoryArticleRepository';
import { InMemoryCommentRepository } from '../fixtures/InMemoryCommentRepository';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

function createTestApp() {
  const tokens = new TestTokenService();
  const articles = new InMemoryArticleRepository();
  const app = createApp({
    authService: new AuthService(
      new InMemoryUserRepository(),
      new TestPasswordHasher(),
      tokens,
    ),
    tokenService: tokens,
    articleService: new ArticleService(articles),
    commentService: new CommentService(
      new InMemoryCommentRepository(),
      articles,
    ),
  });
  return { app, articles };
}

async function seedArticle(
  articles: InMemoryArticleRepository,
): Promise<void> {
  await articles.create({
    slug: 'article',
    title: 'Article',
    description: 'Description',
    body: 'Body',
    authorId: '1',
    tagList: [],
  });
}

describe('comment endpoints', () => {
  test('POST /api/articles/:slug/comments creates a comment', async () => {
    const { app, articles } = createTestApp();
    await seedArticle(articles);
    const response = await request(app)
      .post('/api/articles/article/comments')
      .set('Authorization', 'Token token-1')
      .send({ comment: { body: 'First comment' } })
      .expect(201);
    expect(response.body.comment).toMatchObject({
      id: '1',
      body: 'First comment',
    });
  });

  test('GET /api/articles/:slug/comments lists comments', async () => {
    const { app, articles } = createTestApp();
    await seedArticle(articles);
    await request(app)
      .post('/api/articles/article/comments')
      .set('Authorization', 'Token token-1')
      .send({ comment: { body: 'First comment' } });
    const response = await request(app)
      .get('/api/articles/article/comments')
      .expect(200);
    expect(response.body.comments).toHaveLength(1);
  });

  test('DELETE /api/articles/:slug/comments/:id deletes an owned comment', async () => {
    const { app, articles } = createTestApp();
    await seedArticle(articles);
    await request(app)
      .post('/api/articles/article/comments')
      .set('Authorization', 'Token token-1')
      .send({ comment: { body: 'First comment' } });
    await request(app)
      .delete('/api/articles/article/comments/1')
      .set('Authorization', 'Token token-1')
      .expect(204);
    const response = await request(app)
      .get('/api/articles/article/comments')
      .expect(200);
    expect(response.body.comments).toEqual([]);
  });

  test('DELETE comment rejects a non-author', async () => {
    const { app, articles } = createTestApp();
    await seedArticle(articles);
    await request(app)
      .post('/api/articles/article/comments')
      .set('Authorization', 'Token token-1')
      .send({ comment: { body: 'First comment' } });
    await request(app)
      .delete('/api/articles/article/comments/1')
      .set('Authorization', 'Token token-2')
      .expect(403);
  });

  test('POST comment rejects an empty body with 422', async () => {
    const { app, articles } = createTestApp();
    await seedArticle(articles);
    const response = await request(app)
      .post('/api/articles/article/comments')
      .set('Authorization', 'Token token-1')
      .send({ comment: { body: '' } })
      .expect(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });

  test('comment routes return 404 for a missing article', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .get('/api/articles/missing/comments')
      .expect(404);
    expect(response.body.errors.body).toEqual(['Article missing not found']);
  });
});

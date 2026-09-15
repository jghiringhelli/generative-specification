import request from 'supertest';
import { createApp } from '../../src/app';
import { ArticleService } from '../../src/articles/ArticleService';
import { AuthService } from '../../src/auth/AuthService';
import { InMemoryArticleRepository } from '../fixtures/InMemoryArticleRepository';
import { InMemoryUserRepository } from '../fixtures/InMemoryUserRepository';
import { TestPasswordHasher } from '../fixtures/TestPasswordHasher';
import { TestTokenService } from '../fixtures/TestTokenService';

function createTestContext() {
  const tokens = new TestTokenService();
  const repository = new InMemoryArticleRepository();
  const app = createApp({
    authService: new AuthService(
      new InMemoryUserRepository(),
      new TestPasswordHasher(),
      tokens,
    ),
    tokenService: tokens,
    articleService: new ArticleService(repository),
  });
  return { app, repository };
}

const articleBody = {
  article: {
    title: 'Testing Conduit',
    description: 'Article tests',
    body: 'Complete article body',
    tagList: ['testing'],
  },
};

async function createArticle(app: ReturnType<typeof createTestContext>['app']) {
  return request(app)
    .post('/api/articles')
    .set('Authorization', 'Token token-1')
    .send(articleBody);
}

describe('article endpoints', () => {
  test('POST and GET /api/articles creates and retrieves an article', async () => {
    const { app } = createTestContext();
    await createArticle(app).expect(201);
    const response = await request(app)
      .get('/api/articles/testing-conduit')
      .expect(200);
    expect(response.body.article.body).toBe('Complete article body');
  });

  test('GET /api/articles filters and paginates without returning body', async () => {
    const { app } = createTestContext();
    await createArticle(app);
    await request(app)
      .post('/api/articles')
      .set('Authorization', 'Token token-1')
      .send({ article: {
        title: 'Other',
        description: 'Other article',
        body: 'Other body',
        tagList: ['other'],
      } });
    const response = await request(app)
      .get('/api/articles?tag=testing&author=alice&limit=1&offset=0')
      .expect(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].body).toBeUndefined();
    expect(response.body.articlesCount).toBe(1);
  });

  test('GET /api/articles/feed returns followed-author articles without body', async () => {
    const { app, repository } = createTestContext();
    await repository.create({
      slug: 'from-bob',
      title: 'From Bob',
      description: 'Feed item',
      body: 'Hidden body',
      authorId: '2',
      tagList: [],
    });
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', 'Token token-1')
      .expect(200);
    expect(response.body.articles[0].slug).toBe('from-bob');
    expect(response.body.articles[0].body).toBeUndefined();
  });

  test('PUT /api/articles/:slug updates an author-owned article', async () => {
    const { app } = createTestContext();
    await createArticle(app);
    const response = await request(app)
      .put('/api/articles/testing-conduit')
      .set('Authorization', 'Token token-1')
      .send({ article: { title: 'Updated Title' } })
      .expect(200);
    expect(response.body.article.slug).toBe('updated-title');
  });

  test('PUT /api/articles/:slug rejects a non-author', async () => {
    const { app } = createTestContext();
    await createArticle(app);
    await request(app)
      .put('/api/articles/testing-conduit')
      .set('Authorization', 'Token token-2')
      .send({ article: { title: 'Stolen' } })
      .expect(403);
  });

  test('DELETE /api/articles/:slug deletes an author-owned article', async () => {
    const { app } = createTestContext();
    await createArticle(app);
    await request(app)
      .delete('/api/articles/testing-conduit')
      .set('Authorization', 'Token token-1')
      .expect(204);
    await request(app).get('/api/articles/testing-conduit').expect(404);
  });

  test('favorite endpoints add and remove a favorite', async () => {
    const { app } = createTestContext();
    await createArticle(app);
    const added = await request(app)
      .post('/api/articles/testing-conduit/favorite')
      .set('Authorization', 'Token token-2')
      .expect(200);
    expect(added.body.article).toMatchObject({
      favorited: true,
      favoritesCount: 1,
    });

    test('GET /api/articles filters by favoriting username', async () => {
      const { app } = createTestContext();
      await createArticle(app);
      await request(app)
        .post('/api/articles/testing-conduit/favorite')
        .set('Authorization', 'Token token-2');
      const response = await request(app)
        .get('/api/articles?favorited=bob')
        .expect(200);
      expect(response.body.articles).toHaveLength(1);
    });
    const removed = await request(app)
      .delete('/api/articles/testing-conduit/favorite')
      .set('Authorization', 'Token token-2')
      .expect(200);
    expect(removed.body.article).toMatchObject({
      favorited: false,
      favoritesCount: 0,
    });
  });

  test('protected article endpoints require authentication', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/articles').send(articleBody).expect(401);
    await request(app).get('/api/articles/feed').expect(401);
  });

  test('missing articles return the API error format', async () => {
    const { app } = createTestContext();
    const response = await request(app)
      .get('/api/articles/does-not-exist')
      .expect(404);
    expect(response.body).toEqual({
      errors: { body: ['Article does-not-exist not found'] },
    });
  });
});

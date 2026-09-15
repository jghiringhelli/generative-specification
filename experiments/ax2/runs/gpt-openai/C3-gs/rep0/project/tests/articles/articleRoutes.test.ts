import express from 'express';
import request from 'supertest';
import { ArticleService, ArticleView } from '../../src/articles/ArticleService';
import { createArticleRouter } from '../../src/articles/articleRoutes';
import { AuthService } from '../../src/auth/AuthService';
import { errorHandler } from '../../src/http/errorHandler';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const article: ArticleView = {
  slug: 'hello', title: 'Hello', description: 'World', body: 'Body', tagList: ['test'],
  createdAt: new Date(), updatedAt: new Date(), favorited: false, favoritesCount: 0,
  author: { username: 'alice', bio: null, image: null, following: false },
};

describe('article endpoints', () => {
  const service = {
    list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(),
    delete: jest.fn(), favorite: jest.fn(), unfavorite: jest.fn(),
  } as unknown as jest.Mocked<ArticleService>;
  const user: UserRecord = {
    id: 'user-id', email: 'alice@example.com', username: 'alice',
    passwordHash: 'hash', bio: null, image: null,
  };
  const users = {
    findById: jest.fn(), findByEmail: jest.fn(), findByUsername: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  } as jest.Mocked<IUserRepository>;
  const auth = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
  const app = express().use(express.json())
    .use('/api/articles', createArticleRouter(service, auth)).use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    service.list.mockResolvedValue({ articles: [], articlesCount: 0 });
    service.get.mockResolvedValue(article);
    service.create.mockResolvedValue(article);
    service.update.mockResolvedValue(article);
    service.favorite.mockResolvedValue({ ...article, favorited: true, favoritesCount: 1 });
    service.unfavorite.mockResolvedValue(article);
    users.create.mockResolvedValue(user);
  });

  async function token(): Promise<string> {
    return (await auth.register({
      email: user.email, username: user.username, password: 'password123',
    })).token;
  }

  test('lists articles with filters and pagination', async () => {
    await request(app).get('/api/articles?tag=test&limit=10&offset=5').expect(200);
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({
      tag: 'test', limit: 10, offset: 5,
    }), undefined);
  });
  test('lists the authenticated feed', async () => {
    await request(app).get('/api/articles/feed').set('Authorization', `Token ${await token()}`).expect(200);
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ followerId: 'user-id' }), 'user-id');
  });
  test('gets an article', async () => {
    await request(app).get('/api/articles/hello').expect(200);
  });
  test('creates an article', async () => {
    await request(app).post('/api/articles').set('Authorization', `Token ${await token()}`)
      .send({ article: { title: 'Hello', description: 'World', body: 'Body', tagList: [] } })
      .expect(201);
  });
  test('updates an article', async () => {
    await request(app).put('/api/articles/hello').set('Authorization', `Token ${await token()}`)
      .send({ article: { title: 'Changed' } }).expect(200);
  });
  test('deletes an article', async () => {
    await request(app).delete('/api/articles/hello')
      .set('Authorization', `Token ${await token()}`).expect(204);
  });
  test('favorites an article', async () => {
    await request(app).post('/api/articles/hello/favorite')
      .set('Authorization', `Token ${await token()}`).expect(200);
  });
  test('unfavorites an article', async () => {
    await request(app).delete('/api/articles/hello/favorite')
      .set('Authorization', `Token ${await token()}`).expect(200);
  });
  test('rejects unauthenticated writes', async () => {
    await request(app).delete('/api/articles/hello').expect(401);
  });
});

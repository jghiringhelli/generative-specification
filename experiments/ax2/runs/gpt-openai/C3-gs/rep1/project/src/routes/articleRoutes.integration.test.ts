import request from 'supertest';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService } from '../auth/ITokenService';
import { createApp } from '../app';
import { ArticleController } from '../controllers/ArticleController';
import { AuthController } from '../controllers/AuthController';
import type { ArticleFilters, ArticleListResult, ArticleRecord, CreateArticleRecord, IArticleRepository, UpdateArticleRecord } from '../repositories/IArticleRepository';
import type { CreateUserRecord, IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';
import { ArticleService } from '../services/ArticleService';
import { AuthService } from '../services/AuthService';

const now = new Date('2026-01-01T00:00:00.000Z');
class ArticleStore implements IArticleRepository {
  public records: ArticleRecord[] = [];
  public findBySlug(slug: string, _viewerId?: string) {
    const article = this.records.find((item) => item.slug === slug);
    return Promise.resolve(article ?? null);
  }
  public list(filters: ArticleFilters): Promise<ArticleListResult> {
    let rows = this.records;
    if (filters.tag) rows = rows.filter((item) => item.tagList.includes(filters.tag!));
    if (filters.author) rows = rows.filter((item) => item.author.username === filters.author);
    if (filters.favoritedBy) rows = rows.filter((item) => item.favorited);
    return Promise.resolve({ articles: rows.slice(filters.offset, filters.offset + filters.limit), count: rows.length });
  }
  public feed(userId: string, limit: number, offset: number) { return this.list({ limit, offset, viewerId: userId }); }
  public create(data: CreateArticleRecord) {
    const article: ArticleRecord = { ...data, id: `a-${this.records.length}`, author: { username: 'alice', bio: null, image: null, following: false }, favorited: false, favoritesCount: 0, createdAt: now, updatedAt: now };
    this.records.push(article); return Promise.resolve(article);
  }
  public update(id: string, data: UpdateArticleRecord) {
    const index = this.records.findIndex((item) => item.id === id);
    this.records[index] = { ...this.records[index], ...data, updatedAt: now };
    return Promise.resolve(this.records[index]);
  }
  public delete(id: string) { this.records = this.records.filter((item) => item.id !== id); return Promise.resolve(); }
  public favorite(articleId: string) { this.records = this.records.map((item) => item.id === articleId ? { ...item, favorited: true, favoritesCount: 1 } : item); return Promise.resolve(); }
  public unfavorite(articleId: string) { this.records = this.records.map((item) => item.id === articleId ? { ...item, favorited: false, favoritesCount: 0 } : item); return Promise.resolve(); }
}

class UserStore implements IUserRepository {
  private user: UserRecord | null = null;
  public findById(id: string) { return Promise.resolve(this.user?.id === id ? this.user : null); }
  public findByEmail(email: string) { return Promise.resolve(this.user?.email === email ? this.user : null); }
  public findByUsername(username: string) { return Promise.resolve(this.user?.username === username ? this.user : null); }
  public create(data: CreateUserRecord) { this.user = { id: 'author', bio: null, image: null, ...data }; return Promise.resolve(this.user); }
  public update(_id: string, data: UpdateUserRecord) { this.user = { ...this.user!, ...data } as UserRecord; return Promise.resolve(this.user); }
}

function setup() {
  const store = new ArticleStore();
  const tokens: ITokenService = { sign: ({ userId }) => userId, verify: (token) => ({ userId: token }) };
  const hasher: IPasswordHasher = { hash: async (value) => value, verify: async () => true };
  const auth = new AuthController(new AuthService(new UserStore(), hasher, tokens));
  const article = new ArticleController(new ArticleService(store));
  return { app: createApp({ authController: auth, articleController: article, tokenService: tokens }), store };
}
const payload = { article: { title: 'Hello World', description: 'Intro', body: 'Full body', tagList: ['news'] } };

async function createArticle(app: ReturnType<typeof createApp>) {
  return request(app).post('/api/articles').set('Authorization', 'Token author').send(payload);
}

describe('article endpoints', () => {
  test('POST and GET create and retrieve an article', async () => {
    const { app } = setup();
    expect((await createArticle(app)).status).toBe(201);
    const response = await request(app).get('/api/articles/hello-world');
    expect(response.body.article.body).toBe('Full body');
  });

  test('GET returns 404 for an unknown article', async () => {
    const response = await request(setup().app).get('/api/articles/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ errors: { body: ['Article not found'] } });
  });

  test('GET list omits body and applies tag, author, and pagination filters', async () => {
    const { app } = setup(); await createArticle(app);
    const response = await request(app).get('/api/articles?tag=news&author=alice&limit=1&offset=0');
    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  test('GET favorited filter returns favorited articles', async () => {
    const { app, store } = setup(); await createArticle(app); await store.favorite('a-0', 'fan');
    const response = await request(app).get('/api/articles?favorited=fan');
    expect(response.body.articlesCount).toBe(1);
  });

  test('GET feed requires authentication and omits body', async () => {
    const { app } = setup(); await createArticle(app);
    expect((await request(app).get('/api/articles/feed')).status).toBe(401);
    const response = await request(app).get('/api/articles/feed').set('Authorization', 'Token author');
    expect(response.body.articles[0].body).toBeUndefined();
  });

  test('PUT rejects a non-author and updates for the author', async () => {
    const { app } = setup(); await createArticle(app);
    expect((await request(app).put('/api/articles/hello-world').set('Authorization', 'Token stranger').send({ article: { title: 'No' } })).status).toBe(403);
    const response = await request(app).put('/api/articles/hello-world').set('Authorization', 'Token author').send({ article: { title: 'Updated' } });
    expect(response.body.article.slug).toBe('updated');
  });

  test('DELETE rejects a non-author and removes for the author', async () => {
    const { app } = setup(); await createArticle(app);
    expect((await request(app).delete('/api/articles/hello-world').set('Authorization', 'Token stranger')).status).toBe(403);
    expect((await request(app).delete('/api/articles/hello-world').set('Authorization', 'Token author')).status).toBe(204);
  });

  test('favorite and unfavorite update favorite state', async () => {
    const { app } = setup(); await createArticle(app);
    const favored = await request(app).post('/api/articles/hello-world/favorite').set('Authorization', 'Token fan');
    expect(favored.body.article.favorited).toBe(true);
    const unfavored = await request(app).delete('/api/articles/hello-world/favorite').set('Authorization', 'Token fan');
    expect(unfavored.body.article.favorited).toBe(false);
  });
});

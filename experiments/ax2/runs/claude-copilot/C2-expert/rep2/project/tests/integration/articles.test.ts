import request from 'supertest';
import { Express } from 'express';
import {
  buildTestApp,
  resetDatabase,
  disconnectDatabase,
  registerUser,
  authHeader,
  RegisteredUser
} from '../helpers/db';

interface ArticlePayload {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

async function createArticle(
  app: Express,
  author: RegisteredUser,
  payload: ArticlePayload = {}
): Promise<string> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(author.token))
    .send({
      article: {
        title: payload.title ?? 'A Title',
        description: payload.description ?? 'A description',
        body: payload.body ?? 'The body',
        tagList: payload.tagList ?? []
      }
    });
  return response.body.article.slug;
}

describe('Article endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('creates an article authored by the current user', async () => {
    const author = await registerUser(app);
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Hello', description: 'desc', body: 'body', tagList: ['ai'] } });
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toContain('hello');
    expect(response.body.article.author.username).toBe(author.username);
    expect(response.body.article.tagList).toEqual(['ai']);
  });

  it('returns 401 when creating an article without authentication', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({ article: { title: 'x', description: 'y', body: 'z' } });
    expect(response.status).toBe(401);
  });

  it('lists articles without a filter and reports articlesCount', async () => {
    const author = await registerUser(app);
    await createArticle(app, author, { title: 'One' });
    await createArticle(app, author, { title: 'Two' });
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(2);
    expect(response.body.articles).toHaveLength(2);
  });

  it('omits the body field from article list items', async () => {
    const author = await registerUser(app);
    await createArticle(app, author, { title: 'One', body: 'secret body' });
    const response = await request(app).get('/api/articles');
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('lists articles filtered by tag', async () => {
    const author = await registerUser(app);
    await createArticle(app, author, { title: 'Tagged', tagList: ['ml'] });
    await createArticle(app, author, { title: 'Untagged', tagList: ['other'] });
    const response = await request(app).get('/api/articles').query({ tag: 'ml' });
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('ml');
  });

  it('lists articles filtered by author', async () => {
    const alice = await registerUser(app, { username: 'alice' });
    const bob = await registerUser(app, { username: 'bob' });
    await createArticle(app, alice, { title: 'By Alice' });
    await createArticle(app, bob, { title: 'By Bob' });
    const response = await request(app).get('/api/articles').query({ author: 'alice' });
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].author.username).toBe('alice');
  });

  it('lists articles filtered by favorited user', async () => {
    const author = await registerUser(app, { username: 'author' });
    const fan = await registerUser(app, { username: 'fan' });
    const slug = await createArticle(app, author, { title: 'Popular' });
    await createArticle(app, author, { title: 'Ignored' });
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    const response = await request(app).get('/api/articles').query({ favorited: 'fan' });
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].slug).toBe(slug);
  });

  it('paginates the article list with limit and offset', async () => {
    const author = await registerUser(app);
    await createArticle(app, author, { title: 'One' });
    await createArticle(app, author, { title: 'Two' });
    await createArticle(app, author, { title: 'Three' });
    const response = await request(app).get('/api/articles').query({ limit: 1, offset: 1 });
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(3);
  });

  it('returns 422 when pagination limit is negative', async () => {
    const response = await request(app).get('/api/articles').query({ limit: -5 });
    expect(response.status).toBe(422);
  });

  it('returns the feed of articles from followed authors', async () => {
    const author = await registerUser(app, { username: 'author' });
    const follower = await registerUser(app, { username: 'follower' });
    await createArticle(app, author, { title: 'Followed post' });
    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
  });

  it('returns 401 when requesting the feed without authentication', async () => {
    const response = await request(app).get('/api/articles/feed');
    expect(response.status).toBe(401);
  });

  it('gets a single article by slug including its body', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author, { title: 'Readable', body: 'full text' });
    const response = await request(app).get(`/api/articles/${slug}`);
    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe('full text');
  });

  it('returns 404 when getting an article that does not exist', async () => {
    const response = await request(app).get('/api/articles/missing-slug');
    expect(response.status).toBe(404);
  });

  it('updates an article authored by the current user', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author, { title: 'Original' });
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Updated Title' } });
    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe('Updated Title');
  });

  it('returns 403 when updating an article authored by someone else', async () => {
    const author = await registerUser(app, { username: 'author' });
    const intruder = await registerUser(app, { username: 'intruder' });
    const slug = await createArticle(app, author, { title: 'Protected' });
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(intruder.token))
      .send({ article: { title: 'Hijacked' } });
    expect(response.status).toBe(403);
  });

  it('returns 403 when deleting an article authored by someone else', async () => {
    const author = await registerUser(app, { username: 'author' });
    const intruder = await registerUser(app, { username: 'intruder' });
    const slug = await createArticle(app, author, { title: 'Protected' });
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(intruder.token));
    expect(response.status).toBe(403);
  });

  it('deletes an article authored by the current user', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author, { title: 'Disposable' });
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token));
    expect(response.status).toBe(200);
    const followUp = await request(app).get(`/api/articles/${slug}`);
    expect(followUp.status).toBe(404);
  });

  it('favorites and unfavorites an article, tracking favoritesCount', async () => {
    const author = await registerUser(app, { username: 'author' });
    const fan = await registerUser(app, { username: 'fan' });
    const slug = await createArticle(app, author, { title: 'Likeable' });
    const favorited = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);
    const unfavorited = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(unfavorited.body.article.favorited).toBe(false);
    expect(unfavorited.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when favoriting without authentication', async () => {
    const author = await registerUser(app);
    const slug = await createArticle(app, author, { title: 'Likeable' });
    const response = await request(app).post(`/api/articles/${slug}/favorite`);
    expect(response.status).toBe(401);
  });
});

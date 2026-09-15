import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { resetDatabase, disconnect, createUser, TestUser } from '../helpers';

const app = createApp();

interface ArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

async function createArticle(
  application: Express,
  token: string,
  overrides: Partial<ArticleInput> = {},
): Promise<string> {
  const article: ArticleInput = {
    title: overrides.title ?? 'How to Train',
    description: overrides.description ?? 'A description',
    body: overrides.body ?? 'The body',
    tagList: overrides.tagList ?? ['dragons', 'training'],
  };
  const response = await request(application)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article });
  return response.body.article.slug as string;
}

describe('article endpoints', () => {
  let author: TestUser;
  let reader: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    author = await createUser(app, { username: 'author' });
    reader = await createUser(app, { username: 'reader' });
  });

  afterAll(async () => {
    await disconnect();
  });

  it('creates an article and returns it with a slug and body', async () => {
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({
        article: {
          title: 'My First Article',
          description: 'desc',
          body: 'content',
          tagList: ['intro'],
        },
      });
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toContain('my-first-article');
    expect(response.body.article.body).toBe('content');
    expect(response.body.article.tagList).toEqual(['intro']);
  });

  it('returns 401 when creating an article without authentication', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(response.status).toBe(401);
  });

  it('lists articles without a filter and omits the body in list items', async () => {
    await createArticle(app, author.token);
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('lists articles filtered by tag', async () => {
    await createArticle(app, author.token, { tagList: ['angular'] });
    await createArticle(app, author.token, { tagList: ['react'] });
    const response = await request(app).get('/api/articles?tag=angular');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('angular');
  });

  it('lists articles filtered by author', async () => {
    await createArticle(app, author.token);
    await createArticle(app, reader.token);
    const response = await request(app).get('/api/articles?author=author');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].author.username).toBe('author');
  });

  it('lists articles filtered by favorited user', async () => {
    const slug = await createArticle(app, author.token);
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.token}`);
    const response = await request(app).get('/api/articles?favorited=reader');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
  });

  it('paginates the article list with limit and offset', async () => {
    await createArticle(app, author.token, { title: 'One' });
    await createArticle(app, author.token, { title: 'Two' });
    await createArticle(app, author.token, { title: 'Three' });
    const response = await request(app).get('/api/articles?limit=2&offset=1');
    expect(response.status).toBe(200);
    expect(response.body.articles.length).toBe(2);
    expect(response.body.articlesCount).toBe(3);
  });

  it('returns 422 when pagination limit is negative', async () => {
    const response = await request(app).get('/api/articles?limit=-5');
    expect(response.status).toBe(422);
  });

  it('returns the feed of followed authors and omits the body', async () => {
    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set('Authorization', `Token ${reader.token}`);
    await createArticle(app, author.token);
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${reader.token}`);
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('returns 401 when requesting the feed without authentication', async () => {
    const response = await request(app).get('/api/articles/feed');
    expect(response.status).toBe(401);
  });

  it('gets a single article by slug including its body', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app).get(`/api/articles/${slug}`);
    expect(response.status).toBe(200);
    expect(response.body.article.slug).toBe(slug);
    expect(response.body.article.body).toBeDefined();
  });

  it('returns 404 when getting an article that does not exist', async () => {
    const response = await request(app).get('/api/articles/missing-slug');
    expect(response.status).toBe(404);
  });

  it('updates an article authored by the current user', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${author.token}`)
      .send({ article: { title: 'Updated Title' } });
    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe('Updated Title');
  });

  it('returns 403 when updating an article authored by someone else', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${reader.token}`)
      .send({ article: { title: 'Hijack' } });
    expect(response.status).toBe(403);
  });

  it('returns 401 when updating an article without authentication', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .send({ article: { title: 'Nope' } });
    expect(response.status).toBe(401);
  });

  it('deletes an article authored by the current user', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${author.token}`);
    expect(response.status).toBe(200);
  });

  it('returns 403 when deleting an article authored by someone else', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${reader.token}`);
    expect(response.status).toBe(403);
  });

  it('returns 401 when deleting an article without authentication', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app).delete(`/api/articles/${slug}`);
    expect(response.status).toBe(401);
  });

  it('favorites and unfavorites an article', async () => {
    const slug = await createArticle(app, author.token);
    const favorited = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.token}`);
    expect(favorited.status).toBe(200);
    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);

    const unfavorited = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.token}`);
    expect(unfavorited.status).toBe(200);
    expect(unfavorited.body.article.favorited).toBe(false);
    expect(unfavorited.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when favoriting an article without authentication', async () => {
    const slug = await createArticle(app, author.token);
    const response = await request(app).post(`/api/articles/${slug}/favorite`);
    expect(response.status).toBe(401);
  });
});

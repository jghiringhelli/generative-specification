import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, authHeader, registerUser } from '../helpers/app';
import { resetDatabase, disconnectDatabase } from '../helpers/db';

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

async function createArticle(
  token: string,
  overrides: Partial<{
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }> = {}
): Promise<{ slug: string; body: Record<string, unknown> }> {
  const response = await request(app)
    .post('/api/articles')
    .set('Authorization', authHeader(token))
    .send({
      article: {
        title: overrides.title ?? 'A Great Article',
        description: overrides.description ?? 'A description',
        body: overrides.body ?? 'The body',
        tagList: overrides.tagList ?? ['dragons', 'training']
      }
    });
  return { slug: response.body.article.slug, body: response.body };
}

describe('POST /api/articles (create)', () => {
  it('creates an article and returns it with tags and author', async () => {
    const author = await registerUser(app);
    const { body } = await createArticle(author.token, {
      title: 'Unique Title'
    });
    expect(body.article.slug).toContain('unique-title');
    expect(body.article.tagList).toEqual(['dragons', 'training']);
    expect(body.article.author.username).toBe(author.username);
  });

  it('returns 401 when creating without authentication', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(response.status).toBe(401);
  });

  it('returns 422 when the title is missing', async () => {
    const author = await registerUser(app);
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', authHeader(author.token))
      .send({ article: { description: 'd', body: 'b' } });
    expect(response.status).toBe(422);
  });
});

describe('GET /api/articles (list)', () => {
  it('lists articles without a body field in list items', async () => {
    const author = await registerUser(app);
    await createArticle(author.token);
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('filters articles by tag', async () => {
    const author = await registerUser(app);
    await createArticle(author.token, {
      title: 'Tagged',
      tagList: ['angular']
    });
    await createArticle(author.token, {
      title: 'Other',
      tagList: ['react']
    });
    const response = await request(app).get('/api/articles?tag=angular');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toContain('angular');
  });

  it('filters articles by author', async () => {
    const alice = await registerUser(app, { username: 'alice' });
    const bob = await registerUser(app, { username: 'bob' });
    await createArticle(alice.token, { title: 'By Alice' });
    await createArticle(bob.token, { title: 'By Bob' });
    const response = await request(app).get('/api/articles?author=alice');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].author.username).toBe('alice');
  });

  it('filters articles by favorited username', async () => {
    const author = await registerUser(app, { username: 'author' });
    const fan = await registerUser(app, { username: 'fan' });
    const { slug } = await createArticle(author.token, { title: 'Likeable' });
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    const response = await request(app).get('/api/articles?favorited=fan');
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
  });

  it('applies limit and offset pagination', async () => {
    const author = await registerUser(app);
    await createArticle(author.token, { title: 'First' });
    await createArticle(author.token, { title: 'Second' });
    await createArticle(author.token, { title: 'Third' });
    const response = await request(app).get('/api/articles?limit=1&offset=1');
    expect(response.status).toBe(200);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(3);
  });

  it('returns 422 when limit is negative', async () => {
    const response = await request(app).get('/api/articles?limit=-5');
    expect(response.status).toBe(422);
  });
});

describe('GET /api/articles/feed', () => {
  it('returns articles from followed authors when authenticated', async () => {
    const author = await registerUser(app, { username: 'author' });
    const follower = await registerUser(app, { username: 'follower' });
    await createArticle(author.token, { title: 'Followed Post' });
    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set('Authorization', authHeader(follower.token));
    const response = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', authHeader(follower.token));
    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it('returns 401 when requesting the feed without authentication', async () => {
    const response = await request(app).get('/api/articles/feed');
    expect(response.status).toBe(401);
  });
});

describe('GET /api/articles/:slug', () => {
  it('returns a single article including its body', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app).get(`/api/articles/${slug}`);
    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe('The body');
  });

  it('returns 404 when the article does not exist', async () => {
    const response = await request(app).get('/api/articles/missing-slug');
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/articles/:slug (update)', () => {
  it('updates an article owned by the author', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token))
      .send({ article: { title: 'Renamed Title' } });
    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe('Renamed Title');
  });

  it('returns 403 when a non-author tries to update', async () => {
    const author = await registerUser(app, { username: 'author' });
    const intruder = await registerUser(app, { username: 'intruder' });
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', authHeader(intruder.token))
      .send({ article: { title: 'Hijacked' } });
    expect(response.status).toBe(403);
  });

  it('returns 401 when updating without authentication', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .send({ article: { title: 'Nope' } });
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/articles/:slug', () => {
  it('deletes an article owned by the author', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(author.token));
    expect(response.status).toBe(200);
  });

  it('returns 403 when a non-author tries to delete', async () => {
    const author = await registerUser(app, { username: 'author' });
    const intruder = await registerUser(app, { username: 'intruder' });
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', authHeader(intruder.token));
    expect(response.status).toBe(403);
  });

  it('returns 401 when deleting without authentication', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app).delete(`/api/articles/${slug}`);
    expect(response.status).toBe(401);
  });
});

describe('article favoriting', () => {
  it('favorites an article and increments favoritesCount', async () => {
    const author = await registerUser(app, { username: 'author' });
    const fan = await registerUser(app, { username: 'fan' });
    const { slug } = await createArticle(author.token);
    const response = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(response.status).toBe(200);
    expect(response.body.article.favorited).toBe(true);
    expect(response.body.article.favoritesCount).toBe(1);
  });

  it('unfavorites an article and decrements favoritesCount', async () => {
    const author = await registerUser(app, { username: 'author' });
    const fan = await registerUser(app, { username: 'fan' });
    const { slug } = await createArticle(author.token);
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    const response = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', authHeader(fan.token));
    expect(response.status).toBe(200);
    expect(response.body.article.favorited).toBe(false);
    expect(response.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when favoriting without authentication', async () => {
    const author = await registerUser(app);
    const { slug } = await createArticle(author.token);
    const response = await request(app).post(
      `/api/articles/${slug}/favorite`
    );
    expect(response.status).toBe(401);
  });
});

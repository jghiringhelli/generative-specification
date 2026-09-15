import request from 'supertest';
import { Application } from 'express';
import { buildTestApp, prisma, resetDatabase } from './helpers';

let app: Application;

beforeAll(() => {
  app = buildTestApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Registers a user and returns its auth token.
 * @param username the username to register
 * @returns the issued JWT token
 */
async function registerUser(username: string): Promise<string> {
  const res = await request(app)
    .post('/api/users')
    .send({ user: { email: `${username}@example.com`, username, password: 'password123' } });
  return res.body.user.token;
}

/**
 * Creates an article via the API and returns its slug.
 * @param token the author's auth token
 * @param overrides partial article fields to merge over defaults
 * @returns the created article's slug
 */
async function createArticle(
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({
      article: {
        title: 'How to Train Your Dragon',
        description: 'Ever wonder how?',
        body: 'It takes a Jacobian',
        tagList: ['dragons', 'training'],
        ...overrides
      }
    });
  return res.body.article.slug;
}

describe('POST /api/articles', () => {
  it('creates an article and returns it with a slug and body', async () => {
    const token = await registerUser('author');
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'My First Post',
          description: 'A description',
          body: 'The body',
          tagList: ['intro']
        }
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toContain('my-first-post');
    expect(res.body.article.body).toBe('The body');
    expect(res.body.article.tagList).toContain('intro');
  });

  it('returns 401 when creating an article without authentication', async () => {
    const res = await request(app)
      .post('/api/articles')
      .send({ article: { title: 't', description: 'd', body: 'b' } });
    expect(res.status).toBe(401);
  });

  it('returns 422 when required fields are missing', async () => {
    const token = await registerUser('author');
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: '' } });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/articles', () => {
  it('lists articles without a filter and omits body from list items', async () => {
    const token = await registerUser('author');
    await createArticle(token);
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it('filters articles by tag', async () => {
    const token = await registerUser('author');
    await createArticle(token, { title: 'Tagged', tagList: ['unique-tag'] });
    await createArticle(token, { title: 'Untagged', tagList: ['other'] });
    const res = await request(app).get('/api/articles').query({ tag: 'unique-tag' });
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
  });

  it('filters articles by author', async () => {
    const one = await registerUser('writer-one');
    const two = await registerUser('writer-two');
    await createArticle(one, { title: 'By One' });
    await createArticle(two, { title: 'By Two' });
    const res = await request(app).get('/api/articles').query({ author: 'writer-one' });
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].author.username).toBe('writer-one');
  });

  it('filters articles by favorited username', async () => {
    const author = await registerUser('author');
    const fan = await registerUser('fan');
    const slug = await createArticle(author);
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    const res = await request(app).get('/api/articles').query({ favorited: 'fan' });
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
  });

  it('applies pagination via limit and offset', async () => {
    const token = await registerUser('author');
    await createArticle(token, { title: 'Post A' });
    await createArticle(token, { title: 'Post B' });
    await createArticle(token, { title: 'Post C' });
    const res = await request(app).get('/api/articles').query({ limit: 1, offset: 1 });
    expect(res.status).toBe(200);
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articlesCount).toBe(3);
  });

  it('returns 422 when limit is negative', async () => {
    const res = await request(app).get('/api/articles').query({ limit: -5 });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/articles/feed', () => {
  it('returns articles authored by followed users', async () => {
    const author = await registerUser('author');
    const follower = await registerUser('follower');
    await createArticle(author, { title: 'Followed Post' });
    await request(app)
      .post('/api/profiles/author/follow')
      .set('Authorization', `Token ${follower}`);
    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${follower}`);
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
  });

  it('returns 401 when requesting the feed without authentication', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/articles/:slug', () => {
  it('returns a single article including its body', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.body).toBe('It takes a Jacobian');
  });

  it('returns 404 when the article does not exist', async () => {
    const res = await request(app).get('/api/articles/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/articles/:slug', () => {
  it('updates an article owned by the author', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated Title' } });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('Updated Title');
  });

  it('returns 403 when a non-author tries to update the article', async () => {
    const author = await registerUser('author');
    const other = await registerUser('intruder');
    const slug = await createArticle(author);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${other}`)
      .send({ article: { title: 'Hijacked' } });
    expect(res.status).toBe(403);
  });

  it('returns 401 when updating without authentication', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .send({ article: { title: 'x' } });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/articles/:slug', () => {
  it('deletes an article owned by the author', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    const check = await request(app).get(`/api/articles/${slug}`);
    expect(check.status).toBe(404);
  });

  it('returns 403 when a non-author tries to delete the article', async () => {
    const author = await registerUser('author');
    const other = await registerUser('intruder');
    const slug = await createArticle(author);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${other}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 when deleting without authentication', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app).delete(`/api/articles/${slug}`);
    expect(res.status).toBe(401);
  });
});

describe('article favouriting', () => {
  it('favorites an article and increments the favorites count', async () => {
    const author = await registerUser('author');
    const fan = await registerUser('fan');
    const slug = await createArticle(author);
    const res = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
    expect(res.body.article.favoritesCount).toBe(1);
  });

  it('unfavorites an article and decrements the favorites count', async () => {
    const author = await registerUser('author');
    const fan = await registerUser('fan');
    const slug = await createArticle(author);
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    const res = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${fan}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(false);
    expect(res.body.article.favoritesCount).toBe(0);
  });

  it('returns 401 when favouriting without authentication', async () => {
    const token = await registerUser('author');
    const slug = await createArticle(token);
    const res = await request(app).post(`/api/articles/${slug}/favorite`);
    expect(res.status).toBe(401);
  });
});

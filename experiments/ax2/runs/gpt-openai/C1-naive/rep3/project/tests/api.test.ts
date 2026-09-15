import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

interface RegisteredUser {
  username: string;
  token: string;
}

async function register(username: string): Promise<RegisteredUser> {
  const response = await request(app).post('/api/users').send({
    user: { email: `${username}@example.com`, username, password: 'password123' },
  });
  expect(response.status).toBe(201);
  return response.body.user;
}

function authorized(token: string) {
  return { Authorization: `Token ${token}` };
}

async function createArticle(token: string) {
  const response = await request(app)
    .post('/api/articles')
    .set(authorized(token))
    .send({
      article: {
        title: 'Testing Conduit',
        description: 'An integration test',
        body: 'The article body',
        tagList: ['testing', 'typescript'],
      },
    });
  expect(response.status).toBe(201);
  return response.body.article;
}

beforeEach(async () => {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('authentication', () => {
  it('registers, logs in, gets, and updates the current user', async () => {
    const registered = await register('alice');
    const login = await request(app).post('/api/users/login').send({
      user: { email: 'alice@example.com', password: 'password123' },
    });
    expect(login.status).toBe(200);
    expect(login.body.user.token).toBeTruthy();

    const current = await request(app).get('/api/user').set(authorized(registered.token));
    expect(current.status).toBe(200);
    expect(current.body.user.username).toBe('alice');

    const updated = await request(app)
      .put('/api/user')
      .set(authorized(registered.token))
      .send({ user: { bio: 'Hello', image: 'https://example.com/alice.png' } });
    expect(updated.status).toBe(200);
    expect(updated.body.user.bio).toBe('Hello');
  });
});

describe('profiles', () => {
  it('gets profiles and follows and unfollows users', async () => {
    const alice = await register('alice');
    await register('bob');

    const followed = await request(app)
      .post('/api/profiles/bob/follow')
      .set(authorized(alice.token));
    expect(followed.status).toBe(200);
    expect(followed.body.profile.following).toBe(true);

    const profile = await request(app)
      .get('/api/profiles/bob')
      .set(authorized(alice.token));
    expect(profile.body.profile.following).toBe(true);

    const unfollowed = await request(app)
      .delete('/api/profiles/bob/follow')
      .set(authorized(alice.token));
    expect(unfollowed.body.profile.following).toBe(false);
  });
});

describe('articles', () => {
  it('creates, reads, filters, updates, favorites, feeds, and deletes articles', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    await request(app).post('/api/profiles/alice/follow').set(authorized(bob.token));
    const article = await createArticle(alice.token);

    const fetched = await request(app).get(`/api/articles/${article.slug}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.article.tagList).toEqual(['testing', 'typescript']);

    const listed = await request(app).get('/api/articles?tag=testing&author=alice&limit=10&offset=0');
    expect(listed.body.articlesCount).toBe(1);

    const feed = await request(app).get('/api/articles/feed').set(authorized(bob.token));
    expect(feed.body.articlesCount).toBe(1);

    const favorited = await request(app)
      .post(`/api/articles/${article.slug}/favorite`)
      .set(authorized(bob.token));
    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);

    const favoriteFilter = await request(app).get('/api/articles?favorited=bob');
    expect(favoriteFilter.body.articlesCount).toBe(1);

    const unfavorited = await request(app)
      .delete(`/api/articles/${article.slug}/favorite`)
      .set(authorized(bob.token));
    expect(unfavorited.body.article.favorited).toBe(false);

    const updated = await request(app)
      .put(`/api/articles/${article.slug}`)
      .set(authorized(alice.token))
      .send({ article: { title: 'Updated Conduit', body: 'Updated body' } });
    expect(updated.body.article.title).toBe('Updated Conduit');

    const deleted = await request(app)
      .delete(`/api/articles/${updated.body.article.slug}`)
      .set(authorized(alice.token));
    expect(deleted.status).toBe(204);
  });
});

describe('comments and tags', () => {
  it('creates, lists, and deletes comments and lists tags', async () => {
    const alice = await register('alice');
    const article = await createArticle(alice.token);

    const created = await request(app)
      .post(`/api/articles/${article.slug}/comments`)
      .set(authorized(alice.token))
      .send({ comment: { body: 'A useful comment' } });
    expect(created.status).toBe(201);

    const comments = await request(app).get(`/api/articles/${article.slug}/comments`);
    expect(comments.body.comments).toHaveLength(1);

    const tags = await request(app).get('/api/tags');
    expect(tags.body.tags).toEqual(['testing', 'typescript']);

    const deleted = await request(app)
      .delete(`/api/articles/${article.slug}/comments/${created.body.comment.id}`)
      .set(authorized(alice.token));
    expect(deleted.status).toBe(204);
  });
});

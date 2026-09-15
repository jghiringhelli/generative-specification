import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/prisma';

const app = createApp();

const unique = () => Math.random().toString(36).substring(2, 10);

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication', () => {
  const email = `${unique()}@test.com`;
  const username = `user_${unique()}`;
  const password = 'password123';
  let token: string;

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { email, username, password } });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.username).toBe(username);
    expect(res.body.user.token).toBeDefined();
    token = res.body.user.token;
  });

  it('logs in an existing user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password: 'wrong' } });
    expect(res.status).toBe(401);
  });

  it('gets the current user', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(username);
  });

  it('updates the current user', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'my bio' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('my bio');
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('Profiles & Articles', () => {
  let tokenA: string;
  let tokenB: string;
  let usernameA: string;
  let usernameB: string;
  let slug: string;

  beforeAll(async () => {
    usernameA = `a_${unique()}`;
    usernameB = `b_${unique()}`;
    const a = await request(app)
      .post('/api/users')
      .send({
        user: { email: `${usernameA}@t.com`, username: usernameA, password: 'pw12345' },
      });
    tokenA = a.body.user.token;
    const b = await request(app)
      .post('/api/users')
      .send({
        user: { email: `${usernameB}@t.com`, username: usernameB, password: 'pw12345' },
      });
    tokenB = b.body.user.token;
  });

  it('follows and unfollows a user', async () => {
    const follow = await request(app)
      .post(`/api/profiles/${usernameB}/follow`)
      .set('Authorization', `Token ${tokenA}`);
    expect(follow.status).toBe(200);
    expect(follow.body.profile.following).toBe(true);

    const unfollow = await request(app)
      .delete(`/api/profiles/${usernameB}/follow`)
      .set('Authorization', `Token ${tokenA}`);
    expect(unfollow.status).toBe(200);
    expect(unfollow.body.profile.following).toBe(false);
  });

  it('creates an article', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${tokenA}`)
      .send({
        article: {
          title: 'How to Test',
          description: 'A guide',
          body: 'Body content',
          tagList: ['testing', 'node'],
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBeDefined();
    expect(res.body.article.tagList).toContain('testing');
    slug = res.body.article.slug;
  });

  it('lists articles with a tag filter', async () => {
    const res = await request(app).get('/api/articles?tag=testing');
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
  });

  it('gets a single article', async () => {
    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('How to Test');
  });

  it('favorites and unfavorites an article', async () => {
    const fav = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${tokenB}`);
    expect(fav.status).toBe(200);
    expect(fav.body.article.favorited).toBe(true);
    expect(fav.body.article.favoritesCount).toBe(1);

    const unfav = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${tokenB}`);
    expect(unfav.status).toBe(200);
    expect(unfav.body.article.favorited).toBe(false);
  });

  it('adds, lists and deletes comments', async () => {
    const add = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${tokenB}`)
      .send({ comment: { body: 'Nice article' } });
    expect(add.status).toBe(201);
    const commentId = add.body.comment.id;

    const list = await request(app).get(`/api/articles/${slug}/comments`);
    expect(list.status).toBe(200);
    expect(list.body.comments.length).toBeGreaterThanOrEqual(1);

    const del = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${tokenB}`);
    expect(del.status).toBe(200);
  });

  it('lists tags', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toContain('testing');
  });

  it('updates and deletes an article', async () => {
    const upd = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${tokenA}`)
      .send({ article: { title: 'Updated Title' } });
    expect(upd.status).toBe(200);
    expect(upd.body.article.title).toBe('Updated Title');
    const newSlug = upd.body.article.slug;

    const del = await request(app)
      .delete(`/api/articles/${newSlug}`)
      .set('Authorization', `Token ${tokenA}`);
    expect(del.status).toBe(200);
  });
});

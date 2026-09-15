import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/lib/prisma';

const app = createApp();

const unique = () => Math.random().toString(36).slice(2, 10);

async function registerUser() {
  const username = `user_${unique()}`;
  const email = `${username}@example.com`;
  const password = 'password123';
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password } });
  return { res, username, email, password };
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication', () => {
  it('registers a new user and returns a token', async () => {
    const { res, username, email } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe(username);
    expect(res.body.user.email).toBe(email);
    expect(typeof res.body.user.token).toBe('string');
  });

  it('logs in an existing user', async () => {
    const { email, password } = await registerUser();
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('rejects login with bad password', async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password: 'wrong' } });
    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.user.token;
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBeDefined();
  });

  it('updates the current user', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.user.token;
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'Hello world' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('Hello world');
  });

  it('rejects unauthenticated access to current user', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('Profiles', () => {
  it('gets a profile and follows/unfollows', async () => {
    const target = await registerUser();
    const follower = await registerUser();
    const token = follower.res.body.user.token;

    const profileRes = await request(app).get(`/api/profiles/${target.username}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.profile.username).toBe(target.username);

    const followRes = await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set('Authorization', `Token ${token}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body.profile.following).toBe(true);

    const unfollowRes = await request(app)
      .delete(`/api/profiles/${target.username}/follow`)
      .set('Authorization', `Token ${token}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.profile.following).toBe(false);
  });
});

describe('Articles', () => {
  it('creates, reads, updates, and deletes an article', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.user.token;

    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'How to Train Your Dragon',
          description: 'Ever wonder how?',
          body: 'You have to believe',
          tagList: ['dragons', 'training'],
        },
      });
    expect(createRes.status).toBe(201);
    const slug = createRes.body.article.slug;
    expect(slug).toBeDefined();
    expect(createRes.body.article.tagList).toContain('dragons');

    const getRes = await request(app).get(`/api/articles/${slug}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.article.title).toBe('How to Train Your Dragon');

    const updateRes = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated Title' } });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.article.title).toBe('Updated Title');
    const newSlug = updateRes.body.article.slug;

    const listRes = await request(app).get('/api/articles');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.articles)).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/articles/${newSlug}`)
      .set('Authorization', `Token ${token}`);
    expect(deleteRes.status).toBe(200);
  });

  it('favorites and unfavorites an article', async () => {
    const author = await registerUser();
    const reader = await registerUser();

    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.res.body.user.token}`)
      .send({
        article: {
          title: `Fav Article ${unique()}`,
          description: 'desc',
          body: 'body',
          tagList: [],
        },
      });
    const slug = createRes.body.article.slug;

    const favRes = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.res.body.user.token}`);
    expect(favRes.status).toBe(200);
    expect(favRes.body.article.favorited).toBe(true);
    expect(favRes.body.article.favoritesCount).toBe(1);

    const unfavRes = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.res.body.user.token}`);
    expect(unfavRes.status).toBe(200);
    expect(unfavRes.body.article.favorited).toBe(false);
    expect(unfavRes.body.article.favoritesCount).toBe(0);
  });

  it('returns a feed of followed authors', async () => {
    const author = await registerUser();
    const follower = await registerUser();

    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set('Authorization', `Token ${follower.res.body.user.token}`);

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.res.body.user.token}`)
      .send({
        article: {
          title: `Feed Article ${unique()}`,
          description: 'desc',
          body: 'body',
          tagList: [],
        },
      });

    const feedRes = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${follower.res.body.user.token}`);
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.articlesCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Comments', () => {
  it('adds, lists, and deletes a comment', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.user.token;

    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: `Comment Article ${unique()}`,
          description: 'desc',
          body: 'body',
          tagList: [],
        },
      });
    const slug = createRes.body.article.slug;

    const addRes = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Nice article!' } });
    expect(addRes.status).toBe(201);
    const commentId = addRes.body.comment.id;

    const listRes = await request(app).get(`/api/articles/${slug}/comments`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.comments.length).toBeGreaterThanOrEqual(1);

    const delRes = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${token}`);
    expect(delRes.status).toBe(200);
  });
});

describe('Tags', () => {
  it('lists all tags', async () => {
    const { res: reg } = await registerUser();
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${reg.body.user.token}`)
      .send({
        article: {
          title: `Tag Article ${unique()}`,
          description: 'desc',
          body: 'body',
          tagList: ['uniquetag'],
        },
      });

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toContain('uniquetag');
  });
});

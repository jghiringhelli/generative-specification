import request from 'supertest';
import { createApp } from '../app';
import prisma from '../prisma';

const app = createApp();

const unique = () => Math.random().toString(36).substring(2, 10);

async function registerUser() {
  const username = `user_${unique()}`;
  const email = `${username}@example.com`;
  const password = 'password123';
  const res = await request(app)
    .post('/api/users')
    .send({ user: { username, email, password } });
  return { res, username, email, password, token: res.body.user?.token as string };
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication', () => {
  it('registers a new user', async () => {
    const { res, username } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe(username);
    expect(res.body.user.token).toBeTruthy();
  });

  it('rejects registration with missing fields', async () => {
    const res = await request(app).post('/api/users').send({ user: { email: 'x@y.com' } });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('logs in an existing user', async () => {
    const { email, password } = await registerUser();
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password } });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('rejects login with wrong password', async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email, password: 'wrong' } });
    expect(res.status).toBe(401);
  });

  it('gets the current user', async () => {
    const { token, email } = await registerUser();
    const res = await request(app).get('/api/user').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('updates the current user', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'my bio' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('my bio');
  });
});

describe('Profiles', () => {
  it('gets a profile and follows/unfollows', async () => {
    const a = await registerUser();
    const b = await registerUser();

    const profileRes = await request(app)
      .get(`/api/profiles/${b.username}`)
      .set('Authorization', `Token ${a.token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.profile.following).toBe(false);

    const followRes = await request(app)
      .post(`/api/profiles/${b.username}/follow`)
      .set('Authorization', `Token ${a.token}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body.profile.following).toBe(true);

    const unfollowRes = await request(app)
      .delete(`/api/profiles/${b.username}/follow`)
      .set('Authorization', `Token ${a.token}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.profile.following).toBe(false);
  });
});

describe('Articles', () => {
  it('creates, reads, updates and deletes an article', async () => {
    const { token } = await registerUser();

    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'How to Test',
          description: 'A guide',
          body: 'Some body text',
          tagList: ['testing', 'node'],
        },
      });
    expect(createRes.status).toBe(201);
    const slug = createRes.body.article.slug;
    expect(slug).toBeTruthy();
    expect(createRes.body.article.tagList).toContain('testing');

    const getRes = await request(app).get(`/api/articles/${slug}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.article.title).toBe('How to Test');

    const updateRes = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Updated Title' } });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.article.title).toBe('Updated Title');
    const newSlug = updateRes.body.article.slug;

    const delRes = await request(app)
      .delete(`/api/articles/${newSlug}`)
      .set('Authorization', `Token ${token}`);
    expect(delRes.status).toBe(200);
  });

  it('favorites and unfavorites an article', async () => {
    const author = await registerUser();
    const reader = await registerUser();

    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({ article: { title: 'Fav Me', description: 'd', body: 'b', tagList: [] } });
    const slug = createRes.body.article.slug;

    const favRes = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.token}`);
    expect(favRes.status).toBe(200);
    expect(favRes.body.article.favorited).toBe(true);
    expect(favRes.body.article.favoritesCount).toBe(1);

    const unfavRes = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${reader.token}`);
    expect(unfavRes.status).toBe(200);
    expect(unfavRes.body.article.favorited).toBe(false);
    expect(unfavRes.body.article.favoritesCount).toBe(0);
  });

  it('lists articles and returns a feed', async () => {
    const author = await registerUser();
    const follower = await registerUser();

    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${author.token}`)
      .send({ article: { title: 'Feed Item', description: 'd', body: 'b', tagList: ['feed'] } });

    const listRes = await request(app).get('/api/articles?tag=feed');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.articles)).toBe(true);
    expect(listRes.body.articlesCount).toBeGreaterThanOrEqual(1);

    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set('Authorization', `Token ${follower.token}`);

    const feedRes = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${follower.token}`);
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.articlesCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Comments', () => {
  it('adds, lists and deletes comments', async () => {
    const { token } = await registerUser();
    const createRes = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Comment Host', description: 'd', body: 'b', tagList: [] } });
    const slug = createRes.body.article.slug;

    const addRes = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Nice article' } });
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
  it('lists tags', async () => {
    const { token } = await registerUser();
    await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Tagged', description: 'd', body: 'b', tagList: ['unique-tag'] } });

    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toContain('unique-tag');
  });
});

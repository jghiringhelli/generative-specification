import request from 'supertest';
import app from '../src/app';

const rand = Math.floor(Math.random() * 1000000);
const user = {
  email: `test${rand}@example.com`,
  username: `test${rand}`,
  password: 'password123',
};

let token: string;
let slug: string;

describe('Conduit API', () => {
  it('registers a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.token).toBeDefined();
    token = res.body.user.token;
  });

  it('logs in a user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: user.email, password: user.password } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('gets the current user', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(user.username);
  });

  it('updates the current user', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({ user: { bio: 'my bio' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('my bio');
  });

  it('gets a profile', async () => {
    const res = await request(app)
      .get(`/api/profiles/${user.username}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(user.username);
  });

  it('creates an article', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({
        article: {
          title: 'How to Test',
          description: 'Testing article',
          body: 'The body of the article',
          tagList: ['testing', 'jest'],
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBeDefined();
    slug = res.body.article.slug;
  });

  it('lists articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('gets an article by slug', async () => {
    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('How to Test');
  });

  it('favorites an article', async () => {
    const res = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.article.favorited).toBe(true);
  });

  it('adds a comment', async () => {
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'nice article' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('nice article');
  });

  it('gets comments', async () => {
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  it('gets tags', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  it('deletes an article', async () => {
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
  });
});

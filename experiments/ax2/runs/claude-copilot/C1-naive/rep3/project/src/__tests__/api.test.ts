import request from 'supertest';
import { createApp } from '../app';
import prisma from '../prisma';

const app = createApp();

const unique = Date.now();
const userA = {
  username: `alice_${unique}`,
  email: `alice_${unique}@example.com`,
  password: 'password123',
};
const userB = {
  username: `bob_${unique}`,
  email: `bob_${unique}@example.com`,
  password: 'password123',
};

let tokenA = '';
let tokenB = '';
let slug = '';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/users').send({ user: userA });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(userA.email);
    expect(res.body.user.token).toBeDefined();
    tokenA = res.body.user.token;
  });

  it('registers a second user', async () => {
    const res = await request(app).post('/api/users').send({ user: userB });
    expect(res.status).toBe(201);
    tokenB = res.body.user.token;
  });

  it('logs in', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: userA.email, password: userA.password } });
    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
  });

  it('gets current user', async () => {
    const res = await request(app).get('/api/user').set('Authorization', `Token ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(userA.username);
  });

  it('updates current user', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${tokenA}`)
      .send({ user: { bio: 'I like coding' } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('I like coding');
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('Profiles', () => {
  it('gets a profile', async () => {
    const res = await request(app).get(`/api/profiles/${userB.username}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(userB.username);
  });

  it('follows a user', async () => {
    const res = await request(app)
      .post(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('unfollows a user', async () => {
    const res = await request(app)
      .delete(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});

describe('Articles', () => {
  it('creates an article', async () => {
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${tokenA}`)
      .send({
        article: {
          title: 'How to Train Your Dragon',
          description: 'Ever wonder how?',
          body: 'You have to believe',
          tagList: ['dragons', 'training'],
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toBeDefined();
    expect(res.body.article.tagList).toContain('dragons');
    slug = res.body.article.slug;
  });

  it('gets an article', async () => {
    const res = await request(app).get(`/api/articles/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('How to Train Your Dragon');
  });

  it('lists articles', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
  });

  it('updates an article', async () => {
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${tokenA}`)
      .send({ article: { title: 'How to Train Your Dragon 2' } });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe('How to Train Your Dragon 2');
    slug = res.body.article.slug;
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

  it('gets the feed', async () => {
    await request(app)
      .post(`/api/profiles/${userA.username}/follow`)
      .set('Authorization', `Token ${tokenB}`);
    const res = await request(app).get('/api/articles/feed').set('Authorization', `Token ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
  });
});

describe('Comments', () => {
  let commentId = 0;

  it('adds a comment', async () => {
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${tokenB}`)
      .send({ comment: { body: 'Great article!' } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('Great article!');
    commentId = res.body.comment.id;
  });

  it('gets comments', async () => {
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
  });

  it('deletes a comment', async () => {
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${commentId}`)
      .set('Authorization', `Token ${tokenB}`);
    expect(res.status).toBe(200);
  });
});

describe('Tags', () => {
  it('gets tags', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toContain('dragons');
  });
});

describe('Cleanup', () => {
  it('deletes the article', async () => {
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${tokenA}`);
    expect(res.status).toBe(200);
  });
});

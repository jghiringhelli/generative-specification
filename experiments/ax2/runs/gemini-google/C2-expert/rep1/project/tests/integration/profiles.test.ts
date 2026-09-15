import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';

describe('Profiles Integration Tests', () => {
  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('gets profile successfully for unauthenticated user with following false', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'jake',
          email: 'jake@example.com',
          password: 'password123'
        }
      });

    const res = await request(app).get('/api/profiles/jake');

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.username).toBe('jake');
    expect(res.body.profile.following).toBe(false);
  });

  it('gets profile successfully for authenticated user who follows target', async () => {
    const user1 = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'follower',
          email: 'follower@example.com',
          password: 'password123'
        }
      });

    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'target',
          email: 'target@example.com',
          password: 'password123'
        }
      });

    const token = user1.body.user.token;

    // Follow target first
    await request(app)
      .post('/api/profiles/target/follow')
      .set('Authorization', `Token ${token}`);

    // Check profile with token
    const res = await request(app)
      .get('/api/profiles/target')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('target');
    expect(res.body.profile.following).toBe(true);
  });

  it('follows a user and returns profile with following true', async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'actor',
          email: 'actor@example.com',
          password: 'password123'
        }
      });

    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'leader',
          email: 'leader@example.com',
          password: 'password123'
        }
      });

    const token = user.body.user.token;

    const res = await request(app)
      .post('/api/profiles/leader/follow')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('leader');
    expect(res.body.profile.following).toBe(true);
  });

  it('unfollows a followed user and returns profile with following false', async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'unfollower',
          email: 'unfollower@example.com',
          password: 'password123'
        }
      });

    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'guru',
          email: 'guru@example.com',
          password: 'password123'
        }
      });

    const token = user.body.user.token;

    await request(app)
      .post('/api/profiles/guru/follow')
      .set('Authorization', `Token ${token}`);

    const res = await request(app)
      .delete('/api/profiles/guru/follow')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('guru');
    expect(res.body.profile.following).toBe(false);
  });

  it('returns 404 when profile does not exist', async () => {
    const res = await request(app).get('/api/profiles/nonexistentuser');

    expect(res.status).toBe(404);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain("Profile for user 'nonexistentuser' not found");
  });

  it('returns 401 when following without auth token', async () => {
    const res = await request(app).post('/api/profiles/someuser/follow');

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain('Authentication token is required');
  });

  it('returns 404 when following a non-existent user profile', async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'actor2',
          email: 'actor2@example.com',
          password: 'password123'
        }
      });

    const token = user.body.user.token;

    const res = await request(app)
      .post('/api/profiles/ghostuser/follow')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toContain("Profile for user 'ghostuser' not found");
  });

  it('returns 404 when unfollowing a non-existent user profile', async () => {
    const user = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'actor3',
          email: 'actor3@example.com',
          password: 'password123'
        }
      });

    const token = user.body.user.token;

    const res = await request(app)
      .delete('/api/profiles/ghostuser/follow')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.errors.body).toContain("Profile for user 'ghostuser' not found");
  });
});

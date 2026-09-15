import request from 'supertest';
import { createApp } from '../../src/app';
import { getPrismaClient } from '../../src/repositories/prisma.client';
import { clearDatabase } from '../helpers/db.helper';

describe('Auth Endpoints Integration', () => {
  const app = createApp();
  const prisma = getPrismaClient();

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('registers a new user successfully with 201 status and returns token', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'johndoe@example.com',
          password: 'password123',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('johndoe');
    expect(res.body.user.email).toBe('johndoe@example.com');
    expect(res.body.user.token).toBeDefined();
    expect(res.body.user.bio).toBeNull();
  });

  it('authenticates existing user successfully and returns token', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'janedoe',
          email: 'janedoe@example.com',
          password: 'password123',
        },
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'janedoe@example.com',
          password: 'password123',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('janedoe@example.com');
    expect(res.body.user.token).toBeDefined();
  });

  it('returns 422 when email is already registered', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'original',
          email: 'duplicate@example.com',
          password: 'password123',
        },
      });

    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'different',
          email: 'duplicate@example.com',
          password: 'password123',
        },
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors.body)).toBe(true);
  });

  it('returns 422 when login password is incorrect', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'loginuser',
          email: 'loginuser@example.com',
          password: 'correctpassword',
        },
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'loginuser@example.com',
          password: 'wrongpassword',
        },
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns 401 when accessing current user without token', async () => {
    const res = await request(app).get('/api/user');

    expect(res.status).toBe(401);
    expect(res.body.errors.body).toBeDefined();
  });

  it('returns current user profile when valid token is provided', async () => {
    const registerRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'currentuser',
          email: 'currentuser@example.com',
          password: 'password123',
        },
      });

    const token = registerRes.body.user.token;

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('currentuser');
    expect(res.body.user.email).toBe('currentuser@example.com');
  });

  it('updates user profile successfully when authenticated', async () => {
    const registerRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'updateme',
          email: 'updateme@example.com',
          password: 'password123',
        },
      });

    const token = registerRes.body.user.token;

    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I like coding TypeScript',
          image: 'https://example.com/avatar.png',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('I like coding TypeScript');
    expect(res.body.user.image).toBe('https://example.com/avatar.png');
  });
});

import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';

const app = createApp({
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://unused',
  JWT_SECRET: 'integration-secret',
  JWT_EXPIRY: '7d',
  PORT: 3000,
  NODE_ENV: 'test',
});

describe('authentication endpoints', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('POST /api/users registers a user', async () => {
    const response = await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      },
    });
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'alice@example.com',
      username: 'alice',
      bio: null,
      image: null,
    });
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it('POST /api/users/login logs in a user', async () => {
    await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      },
    });
    const response = await request(app).post('/api/users/login').send({
      user: { email: 'alice@example.com', password: 'password123' },
    });
    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('alice');
  });

  it('GET /api/user returns the authenticated user', async () => {
    const registration = await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      },
    });
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${registration.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.com');
  });

  it('PUT /api/user updates the authenticated user', async () => {
    const registration = await request(app).post('/api/users').send({
      user: {
        email: 'alice@example.com',
        username: 'alice',
        password: 'password123',
      },
    });
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${registration.body.user.token}`)
      .send({ user: { bio: 'Conduit author' } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('Conduit author');
  });
});

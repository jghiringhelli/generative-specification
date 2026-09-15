import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/prisma';

const app = createApp();

describe('Auth Integration Tests', () => {
  const uniquePrefix = `test_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const userPayload = {
    username: `${uniquePrefix}_user`,
    email: `${uniquePrefix}@example.com`,
    password: 'securePassword123'
  };

  let token: string;

  beforeAll(async () => {
    // Clean up test data if needed
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: uniquePrefix } }
      });
    } catch {
      // Ignore cleanup error if DB is not connected during static runs
    }
  });

  it('POST /api/users - registers a user successfully', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: userPayload });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(userPayload.email);
    expect(res.body.user.username).toBe(userPayload.username);
    expect(res.body.user).toHaveProperty('token');
    token = res.body.user.token;
  });

  it('POST /api/users - fails on duplicate registration', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: userPayload });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/users/login - logs in user successfully', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: userPayload.email,
          password: userPayload.password
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
    expect(res.body.user.email).toBe(userPayload.email);
  });

  it('POST /api/users/login - rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: userPayload.email,
          password: 'wrong_password'
        }
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('errors');
  });

  it('GET /api/user - returns current user when authorized', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userPayload.email);
    expect(res.body.user.username).toBe(userPayload.username);
  });

  it('GET /api/user - returns 401 when token is missing', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('errors');
  });

  it('PUT /api/user - updates current user details', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'Updated bio information',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('Updated bio information');
    expect(res.body.user.image).toBe('https://api.realworld.io/images/smiley-cyrus.jpg');
  });

  it('PUT /api/user - rejects blank username update', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          username: ''
        }
      });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });
});

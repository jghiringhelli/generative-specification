import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

describe('Auth & User Endpoints', () => {
  const testUser = {
    username: 'testuser_auth',
    email: 'testuser_auth@example.com',
    password: 'password123'
  };

  let token: string;

  beforeAll(async () => {
    // Cleanup prior test data
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, 'updated@example.com'] }
      }
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, 'updated@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  it('POST /api/users - should register a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: testUser });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.token).toBeDefined();
    token = res.body.user.token;
  });

  it('POST /api/users - should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'unique_user',
          email: testUser.email,
          password: 'password123'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.email).toBeDefined();
  });

  it('POST /api/users/login - should authenticate valid user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: testUser.email,
          password: testUser.password
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/users/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: testUser.email,
          password: 'wrongpassword'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors['email or password']).toBeDefined();
  });

  it('GET /api/user - should get current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('PUT /api/user - should update current user profile', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: {
          bio: 'I like coding in TypeScript',
          image: 'https://example.com/avatar.png'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('I like coding in TypeScript');
    expect(res.body.user.image).toBe('https://example.com/avatar.png');
  });
});

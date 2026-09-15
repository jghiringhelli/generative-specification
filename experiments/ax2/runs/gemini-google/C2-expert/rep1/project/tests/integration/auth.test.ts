import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';

describe('Authentication Integration Tests', () => {
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

  it('registers a user successfully with status 201 and returns user object with token', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('john@example.com');
    expect(res.body.user.username).toBe('johndoe');
    expect(res.body.user.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 422 when email is already registered', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'original',
          email: 'duplicate@example.com',
          password: 'password123'
        }
      });

    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'seconduser',
          email: 'duplicate@example.com',
          password: 'password123'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain('email has already been taken');
  });

  it('logs in successfully with valid credentials returning user and token', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'loginuser',
          email: 'login@example.com',
          password: 'mypassword'
        }
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'login@example.com',
          password: 'mypassword'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
    expect(res.body.user.token).toBeDefined();
  });

  it('returns 422 when login password is wrong', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'wrongpassuser',
          email: 'wrongpass@example.com',
          password: 'correctpassword'
        }
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'wrongpass@example.com',
          password: 'wrongpassword'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain('email or password is invalid');
  });

  it('returns current user profile when valid token is provided', async () => {
    const regRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'currentuser',
          email: 'current@example.com',
          password: 'password123'
        }
      });

    const token = regRes.body.user.token;

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('currentuser');
    expect(res.body.user.email).toBe('current@example.com');
  });

  it('returns 401 when requesting current user without token', async () => {
    const res = await request(app).get('/api/user');

    expect(res.status).toBe(401);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.body).toContain('Authentication token is required');
  });

  it('updates current user bio and image successfully', async () => {
    const regRes = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'updateuser',
          email: 'update@example.com',
          password: 'password123'
        }
      });

    const token = regRes.body.user.token;

    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I am a software engineer',
          image: 'https://example.com/avatar.jpg'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('I am a software engineer');
    expect(res.body.user.image).toBe('https://example.com/avatar.jpg');
    expect(res.body.user.username).toBe('updateuser');
  });

  it('returns 422 when registering with invalid email format', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'invaliduser',
          email: 'not-an-email',
          password: 'password123'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 422 when registering with password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'shortpass',
          email: 'short@example.com',
          password: '123'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 422 when registering with duplicate username', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'sameusername',
          email: 'user1@example.com',
          password: 'password123'
        }
      });

    const res = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'sameusername',
          email: 'user2@example.com',
          password: 'password123'
        }
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.body).toContain('username has already been taken');
  });
});

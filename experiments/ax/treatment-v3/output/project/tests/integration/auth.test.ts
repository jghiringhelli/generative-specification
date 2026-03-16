import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
  // Run migrations if needed
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

describe('POST /api/users', () => {
  it('register_with_valid_data_returns_201_with_user_and_token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('jake@jake.jake');
    expect(response.body.user.username).toBe('jake');
    expect(response.body.user.token).toBeDefined();
    expect(response.body.user.bio).toBeNull();
    expect(response.body.user.image).toBeNull();
  });

  it('register_with_missing_email_returns_422', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.body).toContain(expect.stringContaining('email'));
  });

  it('register_with_missing_username_returns_422', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain(expect.stringContaining('username'));
  });

  it('register_with_short_password_returns_422', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'short'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain(expect.stringContaining('8 characters'));
  });

  it('register_with_duplicate_email_returns_422', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'otherjake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Email already taken');
  });

  it('register_with_duplicate_username_returns_422', async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'other@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Username already taken');
  });
});

describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });
  });

  it('login_with_correct_credentials_returns_200_with_user_and_token', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@jake.jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('jake@jake.jake');
    expect(response.body.user.username).toBe('jake');
    expect(response.body.user.token).toBeDefined();
  });

  it('login_with_wrong_email_returns_401', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'wrong@jake.jake',
          password: 'jakejake'
        }
      });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toContain('Invalid email or password');
  });

  it('login_with_wrong_password_returns_401', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@jake.jake',
          password: 'wrongpassword'
        }
      });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toContain('Invalid email or password');
  });
});

describe('GET /api/user', () => {
  let token: string;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });
    token = response.body.user.token;
  });

  it('get_current_user_with_valid_token_returns_200_with_user', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('jake@jake.jake');
    expect(response.body.user.username).toBe('jake');
    expect(response.body.user.token).toBeDefined();
  });

  it('get_current_user_without_token_returns_401', async () => {
    const response = await request(app).get('/api/user');

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toContain('No authorization header');
  });

  it('get_current_user_with_invalid_token_returns_401', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Token invalid.token.here');

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toContain('Invalid or expired token');
  });

  it('get_current_user_with_malformed_auth_header_returns_401', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer ' + token);

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toContain('Invalid authorization header format');
  });
});

describe('PUT /api/user', () => {
  let token: string;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });
    token = response.body.user.token;
  });

  it('update_user_email_returns_200_with_updated_user', async () => {
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          email: 'newemail@jake.jake'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('newemail@jake.jake');
    expect(response.body.user.username).toBe('jake');
  });

  it('update_user_bio_and_image_returns_200_with_updated_user', async () => {
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I like skateboarding',
          image: 'https://example.com/avatar.jpg'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe('I like skateboarding');
    expect(response.body.user.image).toBe('https://example.com/avatar.jpg');
  });

  it('update_user_password_allows_login_with_new_password', async () => {
    await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          password: 'newpassword123'
        }
      });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'jake@jake.jake',
          password: 'newpassword123'
        }
      });

    expect(loginResponse.status).toBe(200);
  });

  it('update_user_without_token_returns_401', async () => {
    const response = await request(app)
      .put('/api/user')
      .send({
        user: {
          bio: 'Test'
        }
      });

    expect(response.status).toBe(401);
  });

  it('update_user_with_invalid_email_format_returns_422', async () => {
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          email: 'not-an-email'
        }
      });

    expect(response.status).toBe(422);
  });

  it('update_user_with_duplicate_email_returns_422', async () => {
    // Create second user
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'other@jake.jake',
          username: 'otherjake',
          password: 'jakejake'
        }
      });

    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          email: 'other@jake.jake'
        }
      });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Email already taken');
  });
});

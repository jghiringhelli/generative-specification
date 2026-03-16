import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Authentication Endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp(prisma);
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
    it('register_with_valid_data_returns_201_and_user_with_token', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(201);

      expect(response.body.user).toMatchObject({
        email: 'john@example.com',
        username: 'johndoe',
        bio: null,
        image: null
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('register_with_missing_email_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(422);

      expect(response.body).toEqual({
        errors: {
          body: expect.arrayContaining([expect.any(String)])
        }
      });
    });

    it('register_with_missing_username_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            password: 'password123'
          }
        })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });

    it('register_with_missing_password_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe'
          }
        })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });

    it('register_with_duplicate_email_returns_422', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(201);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'differentuser',
            password: 'password123'
          }
        })
        .expect(422);

      expect(response.body.errors.body[0]).toContain('Email');
    });

    it('register_with_duplicate_username_returns_422', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(201);

      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'different@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(422);

      expect(response.body.errors.body[0]).toContain('Username');
    });

    it('register_with_invalid_email_format_returns_422', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'not-an-email',
            username: 'johndoe',
            password: 'password123'
          }
        })
        .expect(422);

      expect(response.body.errors.body).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        });
    });

    it('login_with_valid_credentials_returns_200_and_user_with_token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com',
            password: 'password123'
          }
        })
        .expect(200);

      expect(response.body.user).toMatchObject({
        email: 'john@example.com',
        username: 'johndoe'
      });
      expect(response.body.user.token).toBeDefined();
    });

    it('login_with_invalid_email_returns_401', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'nonexistent@example.com',
            password: 'password123'
          }
        })
        .expect(401);

      expect(response.body.errors.body[0]).toContain('Email or password');
    });

    it('login_with_invalid_password_returns_401', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com',
            password: 'wrongpassword'
          }
        })
        .expect(401);

      expect(response.body.errors.body[0]).toContain('Email or password');
    });

    it('login_with_missing_email_returns_422', async () => {
      await request(app)
        .post('/api/users/login')
        .send({
          user: {
            password: 'password123'
          }
        })
        .expect(422);
    });

    it('login_with_missing_password_returns_422', async () => {
      await request(app)
        .post('/api/users/login')
        .send({
          user: {
            email: 'john@example.com'
          }
        })
        .expect(422);
    });
  });

  describe('GET /api/user', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        });

      authToken = response.body.user.token;
    });

    it('get_current_user_with_valid_token_returns_200_and_user', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        email: 'john@example.com',
        username: 'johndoe'
      });
    });

    it('get_current_user_without_token_returns_401', async () => {
      const response = await request(app).get('/api/user').expect(401);

      expect(response.body.errors.body).toBeDefined();
    });

    it('get_current_user_with_invalid_token_returns_401', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', 'Token invalid.token.here')
        .expect(401);
    });

    it('get_current_user_with_bearer_format_returns_401', async () => {
      await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('PUT /api/user', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
          }
        });

      authToken = response.body.user.token;
    });

    it('update_user_with_valid_data_returns_200_and_updated_user', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            bio: 'I like coding',
            image: 'https://example.com/avatar.jpg'
          }
        })
        .expect(200);

      expect(response.body.user).toMatchObject({
        email: 'john@example.com',
        username: 'johndoe',
        bio: 'I like coding',
        image: 'https://example.com/avatar.jpg'
      });
    });

    it('update_user_email_with_unique_value_succeeds', async () => {
      const response = await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            email: 'newemail@example.com'
          }
        })
        .expect(200);

      expect(response.body.user.email).toBe('newemail@example.com');
    });

    it('update_user_with_duplicate_email_returns_422', async () => {
      await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'other@example.com',
            username: 'otheruser',
            password: 'password123'
          }
        });

      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            email: 'other@example.com'
          }
        })
        .expect(422);
    });

    it('update_user_without_token_returns_401', async () => {
      await request(app)
        .put('/api/user')
        .send({
          user: {
            bio: 'New bio'
          }
        })
        .expect(401);
    });

    it('update_user_with_invalid_image_url_returns_422', async () => {
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${authToken}`)
        .send({
          user: {
            image: 'not-a-url'
          }
        })
        .expect(422);
    });
  });
});

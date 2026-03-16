
/**
 * Integration tests for authentication endpoints.
 * Tests full request → response cycle with real database.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import type { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.userFavorite.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/users', () => {
  it('registers new user and returns user with token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        }
      })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: 'test@example.com',
      username: 'testuser',
      bio: null,
      image: null
    });
    expect(response.body.user.token).toBeDefined();
    expect(typeof response.body.user.token).toBe('string');
  });

  it('returns 422 when email is missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'testuser',
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ["email can't be blank"]
      }
    });
  });

  it('returns 422 when username is missing', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ["username can't be blank"]
      }
    });
  });

  it('returns 422 when password is too short', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'short'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['password must be at least 8 characters']
      }
    });
  });

  it('returns 422 when email is already taken', async () => {
    // Register first user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    // Attempt to register with same email
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'test@example.com',
          username: 'user2',
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['email already taken']
      }
    });
  });

  it('returns 422 when username is already taken', async () => {
    // Register first user
    await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    // Attempt to register with same username
    const response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'testuser',
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['username already taken']
      }
    });
  });
});

describe('POST /api/users/login', () => {
  it('authenticates user and returns user with token', async () => {
    // Register user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    // Login
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: 'test@example.com',
      username: 'testuser'
    });
    expect(response.body.user.token).toBeDefined();
  });

  it('returns 422 when email does not exist', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['email or password is invalid']
      }
    });
  });

  it('returns 422 when password is incorrect', async () => {
    // Register user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'correctpassword'
      }
    });

    // Login with wrong password
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['email or password is invalid']
      }
    });
  });

  it('returns 422 when email is missing', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        user: {
          password: 'password123'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ["email can't be blank"]
      }
    });
  });
});

describe('GET /api/user', () => {
  it('returns current user when authenticated', async () => {
    // Register user
    const registerResponse = await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const token = registerResponse.body.user.token;

    // Get current user
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: 'test@example.com',
      username: 'testuser',
      bio: null,
      image: null
    });
    expect(response.body.user.token).toBeDefined();
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(app).get('/api/user').expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['missing authorization token']
      }
    });
  });

  it('returns 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Token invalid.token.here')
      .expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['Invalid or expired token']
      }
    });
  });

  it('returns 401 when Authorization header format is incorrect', async () => {
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer sometoken')
      .expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['missing authorization token']
      }
    });
  });
});

describe('PUT /api/user', () => {
  it('updates user email and returns updated user', async () => {
    // Register user
    const registerResponse = await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const token = registerResponse.body.user.token;

    // Update email
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          email: 'newemail@example.com'
        }
      })
      .expect(200);

    expect(response.body.user.email).toBe('newemail@example.com');
    expect(response.body.user.username).toBe('testuser');
  });

  it('updates user bio and image', async () => {
    // Register user
    const registerResponse = await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const token = registerResponse.body.user.token;

    // Update bio and image
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I am a test user',
          image: 'https://example.com/avatar.jpg'
        }
      })
      .expect(200);

    expect(response.body.user.bio).toBe('I am a test user');
    expect(response.body.user.image).toBe('https://example.com/avatar.jpg');
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .put('/api/user')
      .send({
        user: {
          bio: 'New bio'
        }
      })
      .expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['missing authorization token']
      }
    });
  });

  it('returns 422 when email conflicts with another user', async () => {
    // Register two users
    await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    const user2Response = await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user2Response.body.user.token;

    // Attempt to update user2 email to user1's email
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          email: 'user1@example.com'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['email already taken']
      }
    });
  });

  it('returns 422 when username conflicts with another user', async () => {
    // Register two users
    await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    const user2Response = await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user2Response.body.user.token;

    // Attempt to update user2 username to user1's username
    const response = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          username: 'user1'
        }
      })
      .expect(422);

    expect(response.body).toEqual({
      errors: {
        body: ['username already taken']
      }
    });
  });
});


/**
 * Integration tests for profile endpoints.
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

describe('GET /api/profiles/:username', () => {
  it('returns profile when user exists and viewer is not authenticated', async () => {
    // Create user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const response = await request(app).get('/api/profiles/testuser').expect(200);

    expect(response.body.profile).toEqual({
      username: 'testuser',
      bio: null,
      image: null,
      following: false
    });
  });

  it('returns profile with bio and image when set', async () => {
    // Create user with bio and image
    const registerResponse = await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const token = registerResponse.body.user.token;

    await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I am a test user',
          image: 'https://example.com/avatar.jpg'
        }
      });

    const response = await request(app).get('/api/profiles/testuser').expect(200);

    expect(response.body.profile).toEqual({
      username: 'testuser',
      bio: 'I am a test user',
      image: 'https://example.com/avatar.jpg',
      following: false
    });
  });

  it('returns following true when authenticated user follows the profile', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // User1 follows user2
    await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Get user2's profile as user1
    const response = await request(app)
      .get('/api/profiles/user2')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.profile.following).toBe(true);
  });

  it('returns following false when authenticated user does not follow the profile', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // Get user2's profile as user1 (not following)
    const response = await request(app)
      .get('/api/profiles/user2')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.profile.following).toBe(false);
  });

  it('returns 404 when user does not exist', async () => {
    const response = await request(app).get('/api/profiles/nonexistent').expect(404);

    expect(response.body).toEqual({
      errors: {
        body: ["User with identifier 'nonexistent' not found"]
      }
    });
  });
});

describe('POST /api/profiles/:username/follow', () => {
  it('follows user and returns profile with following true', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // User1 follows user2
    const response = await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.profile).toEqual({
      username: 'user2',
      bio: null,
      image: null,
      following: true
    });
  });

  it('returns 401 when not authenticated', async () => {
    // Create a user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const response = await request(app).post('/api/profiles/testuser/follow').expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['missing authorization token']
      }
    });
  });

  it('returns 404 when target user does not exist', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    const response = await request(app)
      .post('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      errors: {
        body: ["User with identifier 'nonexistent' not found"]
      }
    });
  });

  it('returns 409 when already following', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // Follow once
    await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Attempt to follow again
    const response = await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(409);

    expect(response.body).toEqual({
      errors: {
        body: ['Already following this user']
      }
    });
  });

  it('returns 409 when attempting to follow yourself', async () => {
    const userResponse = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    const token = userResponse.body.user.token;

    const response = await request(app)
      .post('/api/profiles/user1/follow')
      .set('Authorization', `Token ${token}`)
      .expect(409);

    expect(response.body).toEqual({
      errors: {
        body: ['Cannot follow yourself']
      }
    });
  });
});

describe('DELETE /api/profiles/:username/follow', () => {
  it('unfollows user and returns profile with following false', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // Follow first
    await request(app)
      .post('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    // Then unfollow
    const response = await request(app)
      .delete('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(200);

    expect(response.body.profile).toEqual({
      username: 'user2',
      bio: null,
      image: null,
      following: false
    });
  });

  it('returns 401 when not authenticated', async () => {
    // Create a user
    await request(app).post('/api/users').send({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      }
    });

    const response = await request(app).delete('/api/profiles/testuser/follow').expect(401);

    expect(response.body).toEqual({
      errors: {
        body: ['missing authorization token']
      }
    });
  });

  it('returns 404 when target user does not exist', async () => {
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    const response = await request(app)
      .delete('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      errors: {
        body: ["User with identifier 'nonexistent' not found"]
      }
    });
  });

  it('returns 404 when not currently following', async () => {
    // Create two users
    const user1Response = await request(app).post('/api/users').send({
      user: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      }
    });

    await request(app).post('/api/users').send({
      user: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      }
    });

    const token = user1Response.body.user.token;

    // Attempt to unfollow without following first
    const response = await request(app)
      .delete('/api/profiles/user2/follow')
      .set('Authorization', `Token ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      errors: {
        body: ['Follow relationship not found']
      }
    });
  });
});

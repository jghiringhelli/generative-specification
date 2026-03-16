import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Express } from 'express';

const prisma = new PrismaClient();
let app: Express;

beforeAll(async () => {
  app = createApp(prisma);
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

describe('GET /api/profiles/:username', () => {
  it('get_existing_profile_without_auth_returns_200_with_following_false', async () => {
    // Create target user
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    const response = await request(app).get('/api/profiles/jake');

    expect(response.status).toBe(200);
    expect(response.body.profile).toBeDefined();
    expect(response.body.profile.username).toBe('jake');
    expect(response.body.profile.bio).toBeNull();
    expect(response.body.profile.image).toBeNull();
    expect(response.body.profile.following).toBe(false);
  });

  it('get_profile_with_bio_and_image_returns_complete_profile', async () => {
    const registerResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'jake@jake.jake',
          username: 'jake',
          password: 'jakejake'
        }
      });

    const token = registerResponse.body.user.token;

    await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${token}`)
      .send({
        user: {
          bio: 'I work at statefarm',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg'
        }
      });

    const response = await request(app).get('/api/profiles/jake');

    expect(response.status).toBe(200);
    expect(response.body.profile.bio).toBe('I work at statefarm');
    expect(response.body.profile.image).toBe('https://api.realworld.io/images/smiley-cyrus.jpg');
  });

  it('get_nonexistent_profile_returns_404', async () => {
    const response = await request(app).get('/api/profiles/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Profile not found');
  });

  it('get_profile_when_authenticated_and_following_returns_following_true', async () => {
    // Create first user
    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'alice@example.com',
          username: 'alice',
          password: 'password123'
        }
      });

    const aliceToken = user1Response.body.user.token;

    // Create second user
    await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'bob@example.com',
          username: 'bob',
          password: 'password123'
        }
      });

    // Alice follows Bob
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    // Get Bob's profile as Alice
    const response = await request(app)
      .get('/api/profiles/bob')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('bob');
    expect(response.body.profile.following).toBe(true);
  });
});

describe('POST /api/profiles/:username/follow', () => {
  let aliceToken: string;
  let bobToken: string;

  beforeEach(async () => {
    // Create two users
    const aliceResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'alice@example.com',
          username: 'alice',
          password: 'password123'
        }
      });
    aliceToken = aliceResponse.body.user.token;

    const bobResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'bob@example.com',
          username: 'bob',
          password: 'password123'
        }
      });
    bobToken = bobResponse.body.user.token;
  });

  it('follow_existing_user_returns_200_with_following_true', async () => {
    const response = await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('bob');
    expect(response.body.profile.following).toBe(true);
  });

  it('follow_without_auth_returns_401', async () => {
    const response = await request(app).post('/api/profiles/bob/follow');

    expect(response.status).toBe(401);
  });

  it('follow_nonexistent_user_returns_404', async () => {
    const response = await request(app)
      .post('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Profile not found');
  });

  it('follow_self_returns_422', async () => {
    const response = await request(app)
      .post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Cannot follow yourself');
  });

  it('follow_already_followed_user_returns_422', async () => {
    // First follow
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    // Second follow attempt
    const response = await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Already following this user');
  });

  it('follow_persists_and_shows_in_profile_get', async () => {
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    const profileResponse = await request(app)
      .get('/api/profiles/bob')
      .set('Authorization', `Token ${aliceToken}`);

    expect(profileResponse.body.profile.following).toBe(true);
  });
});

describe('DELETE /api/profiles/:username/follow', () => {
  let aliceToken: string;
  let bobToken: string;

  beforeEach(async () => {
    // Create two users
    const aliceResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'alice@example.com',
          username: 'alice',
          password: 'password123'
        }
      });
    aliceToken = aliceResponse.body.user.token;

    const bobResponse = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'bob@example.com',
          username: 'bob',
          password: 'password123'
        }
      });
    bobToken = bobResponse.body.user.token;
  });

  it('unfollow_followed_user_returns_200_with_following_false', async () => {
    // First follow
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    // Then unfollow
    const response = await request(app)
      .delete('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('bob');
    expect(response.body.profile.following).toBe(false);
  });

  it('unfollow_without_auth_returns_401', async () => {
    const response = await request(app).delete('/api/profiles/bob/follow');

    expect(response.status).toBe(401);
  });

  it('unfollow_nonexistent_user_returns_404', async () => {
    const response = await request(app)
      .delete('/api/profiles/nonexistent/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(404);
    expect(response.body.errors.body).toContain('Profile not found');
  });

  it('unfollow_not_followed_user_returns_422', async () => {
    const response = await request(app)
      .delete('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toContain('Not following this user');
  });

  it('unfollow_persists_and_shows_in_profile_get', async () => {
    // Follow
    await request(app)
      .post('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    // Unfollow
    await request(app)
      .delete('/api/profiles/bob/follow')
      .set('Authorization', `Token ${aliceToken}`);

    // Check profile
    const profileResponse = await request(app)
      .get('/api/profiles/bob')
      .set('Authorization', `Token ${aliceToken}`);

    expect(profileResponse.body.profile.following).toBe(false);
  });
});

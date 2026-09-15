import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { generateToken } from '../src/utils/jwt';

describe('Profile Endpoints', () => {
  let user1: any;
  let user2: any;
  let user1Token: string;

  beforeAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['puser1@example.com', 'puser2@example.com'] }
      }
    });

    user1 = await prisma.user.create({
      data: {
        username: 'puser1',
        email: 'puser1@example.com',
        password: 'hashedpassword',
        bio: 'Bio user 1',
        image: 'https://example.com/puser1.jpg'
      }
    });

    user2 = await prisma.user.create({
      data: {
        username: 'puser2',
        email: 'puser2@example.com',
        password: 'hashedpassword',
        bio: 'Bio user 2',
        image: 'https://example.com/puser2.jpg'
      }
    });

    user1Token = generateToken({
      userId: user1.id,
      email: user1.email,
      username: user1.username
    });
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follows.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['puser1@example.com', 'puser2@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  it('GET /api/profiles/:username - should get profile without auth', async () => {
    const res = await request(app).get(`/api/profiles/${user2.username}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe(user2.username);
    expect(res.body.profile.following).toBe(false);
  });

  it('POST /api/profiles/:username/follow - should follow a user', async () => {
    const res = await request(app)
      .post(`/api/profiles/${user2.username}/follow`)
      .set('Authorization', `Token ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('GET /api/profiles/:username - should show following=true when followed', async () => {
    const res = await request(app)
      .get(`/api/profiles/${user2.username}`)
      .set('Authorization', `Token ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow - should unfollow a user', async () => {
    const res = await request(app)
      .delete(`/api/profiles/${user2.username}/follow`)
      .set('Authorization', `Token ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});

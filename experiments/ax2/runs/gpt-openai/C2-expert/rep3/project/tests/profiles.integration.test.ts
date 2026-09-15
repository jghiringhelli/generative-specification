import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/prisma';

const alice = { username: 'alice', email: 'alice@example.com', password: 'secret' };
const bob = { username: 'bob', email: 'bob@example.com', password: 'secret' };

async function register(user: typeof alice): Promise<string> {
  const response = await request(app).post('/api/users').send({ user });
  return response.body.user.token;
}

beforeAll(() => { process.env.JWT_SECRET = 'integration-test-secret'; });
beforeEach(async () => { await prisma.follow.deleteMany(); await prisma.user.deleteMany(); });
afterAll(async () => { await prisma.$disconnect(); });

describe('profile endpoints', () => {
  it('gets a profile without authentication', async () => {
    await register(alice);
    const response = await request(app).get('/api/profiles/alice');
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it('gets a profile with authentication', async () => {
    const token = await register(alice);
    await register(bob);
    const response = await request(app).get('/api/profiles/bob').set('Authorization', `Token ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.username).toBe('bob');
  });

  it('follows a user', async () => {
    const token = await register(alice);
    await register(bob);
    const response = await request(app).post('/api/profiles/bob/follow').set('Authorization', `Token ${token}`);
    expect(response.body.profile.following).toBe(true);
  });

  it('unfollows a user', async () => {
    const token = await register(alice);
    await register(bob);
    await request(app).post('/api/profiles/bob/follow').set('Authorization', `Token ${token}`);
    const response = await request(app).delete('/api/profiles/bob/follow').set('Authorization', `Token ${token}`);
    expect(response.body.profile.following).toBe(false);
  });

  it('returns 404 when profile does not exist', async () => {
    const response = await request(app).get('/api/profiles/missing');
    expect(response.status).toBe(404);
  });

  it('returns 401 when following without authentication', async () => {
    await register(bob);
    const response = await request(app).post('/api/profiles/bob/follow');
    expect(response.status).toBe(401);
  });
});

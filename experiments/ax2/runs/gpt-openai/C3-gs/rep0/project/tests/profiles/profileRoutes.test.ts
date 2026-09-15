import express from 'express';
import request from 'supertest';
import { AuthService } from '../../src/auth/AuthService';
import { errorHandler } from '../../src/http/errorHandler';
import { ProfileService } from '../../src/profiles/ProfileService';
import { createProfileRouter } from '../../src/profiles/profileRoutes';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../../src/repositories/IUserRepository';

const alice: UserRecord = {
  id: 'alice-id', email: 'alice@example.com', username: 'alice',
  passwordHash: 'hash', bio: null, image: null,
};

describe('profile endpoints', () => {
  const profiles: jest.Mocked<IProfileRepository> = {
    findByUsername: jest.fn(), isFollowing: jest.fn(),
    follow: jest.fn(), unfollow: jest.fn(),
  };
  const users: jest.Mocked<IUserRepository> = {
    findById: jest.fn(), findByEmail: jest.fn(), findByUsername: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  };
  const auth = new AuthService(users, 'a-secret-with-at-least-thirty-two-characters');
  const service = new ProfileService(profiles);
  const app = express().use(express.json())
    .use('/api/profiles', createProfileRouter(service, auth)).use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    profiles.findByUsername.mockResolvedValue(alice);
    profiles.isFollowing.mockResolvedValue(false);
  });

  async function token(): Promise<string> {
    users.create.mockResolvedValue({ ...alice, id: 'viewer-id' });
    return (await auth.register({
      email: 'viewer@example.com', username: 'viewer', password: 'password123',
    })).token;
  }

  test('GET /api/profiles/:username returns a profile', async () => {
    await request(app).get('/api/profiles/alice').expect(200)
      .expect(({ body }) => expect(body.profile.username).toBe('alice'));
  });

  test('POST /api/profiles/:username/follow follows a profile', async () => {
    const authorization = await token();
    profiles.isFollowing.mockResolvedValue(true);
    await request(app).post('/api/profiles/alice/follow')
      .set('Authorization', `Token ${authorization}`).expect(200);
    expect(profiles.follow).toHaveBeenCalledWith('viewer-id', 'alice-id');
  });

  test('DELETE /api/profiles/:username/follow unfollows a profile', async () => {
    const authorization = await token();
    await request(app).delete('/api/profiles/alice/follow')
      .set('Authorization', `Token ${authorization}`).expect(200);
    expect(profiles.unfollow).toHaveBeenCalledWith('viewer-id', 'alice-id');
  });
});

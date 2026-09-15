import request from 'supertest';
import type { IPasswordHasher } from '../auth/IPasswordHasher';
import type { ITokenService } from '../auth/ITokenService';
import { createApp } from '../app';
import { AuthController } from '../controllers/AuthController';
import { ProfileController } from '../controllers/ProfileController';
import type { IProfileRepository, ProfileRecord } from '../repositories/IProfileRepository';
import type { CreateUserRecord, IUserRepository, UpdateUserRecord, UserRecord } from '../repositories/IUserRepository';
import { AuthService } from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';

class ProfileTestStore implements IUserRepository {
  private readonly users = new Map<string, UserRecord>();
  private readonly follows = new Set<string>();
  public constructor() {
    this.users.set('target', { id: 'target', email: 'bob@example.com', username: 'bob', passwordHash: 'hash', bio: 'Bio', image: null });
  }
  public findById(id: string) { return Promise.resolve(this.users.get(id) ?? null); }
  public findByEmail(email: string) { return Promise.resolve([...this.users.values()].find((user) => user.email === email) ?? null); }
  public findByUsername(username: string) { return Promise.resolve([...this.users.values()].find((user) => user.username === username) ?? null); }
  public create(data: CreateUserRecord) {
    const user = { id: 'viewer', bio: null, image: null, ...data };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }
  public update(id: string, data: UpdateUserRecord) {
    const user = { ...this.users.get(id)!, ...data } as UserRecord;
    this.users.set(id, user);
    return Promise.resolve(user);
  }
  public async findByUsernameProfile(username: string, viewerId?: string): Promise<ProfileRecord | null> {
    const user = await this.findByUsername(username);
    return user ? { username, bio: user.bio, image: user.image, following: this.follows.has(`${viewerId}:${user.id}`) } : null;
  }
  public follow(followerId: string, followedId: string) { this.follows.add(`${followerId}:${followedId}`); return Promise.resolve(); }
  public unfollow(followerId: string, followedId: string) { this.follows.delete(`${followerId}:${followedId}`); return Promise.resolve(); }
}

function buildApp() {
  const store = new ProfileTestStore();
  const users: IUserRepository = store;
  const profiles: IProfileRepository = {
    findByUsername: (username, viewerId) => store.findByUsernameProfile(username, viewerId),
    follow: (followerId, followedId) => store.follow(followerId, followedId),
    unfollow: (followerId, followedId) => store.unfollow(followerId, followedId),
  };
  const hasher: IPasswordHasher = { hash: async (value) => value, verify: async () => true };
  const tokens: ITokenService = { sign: ({ userId }) => userId, verify: (token) => ({ userId: token }) };
  const auth = new AuthController(new AuthService(users, hasher, tokens));
  const profile = new ProfileController(new ProfileService(profiles, users));
  return createApp({ authController: auth, profileController: profile, tokenService: tokens });
}

describe('profile endpoints', () => {
  test('GET /api/profiles/:username returns a profile', async () => {
    const response = await request(buildApp()).get('/api/profiles/bob');
    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({ username: 'bob', following: false });
  });

  test('POST /api/profiles/:username/follow follows a profile', async () => {
    const response = await request(buildApp()).post('/api/profiles/bob/follow').set('Authorization', 'Token viewer');
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  test('DELETE /api/profiles/:username/follow unfollows a profile', async () => {
    const app = buildApp();
    await request(app).post('/api/profiles/bob/follow').set('Authorization', 'Token viewer');
    const response = await request(app).delete('/api/profiles/bob/follow').set('Authorization', 'Token viewer');
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });
});

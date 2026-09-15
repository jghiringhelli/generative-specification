import request from 'supertest';
import { createApp } from '../../src/app';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../src/repositories/IUserRepository';
import {
  IProfileRepository,
  ProfileEntity,
} from '../../src/repositories/IProfileRepository';
import { AuthService } from '../../src/services/AuthService';

class FakeUserRepository implements IUserRepository {
  public users: UserEntity[] = [];

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return (
      this.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null
    );
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserEntity = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: data.bio ?? '',
      image: data.image ?? '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }
}

class FakeProfileRepository implements IProfileRepository {
  private userRepo: FakeUserRepository;
  private follows: Set<string> = new Set();

  constructor(userRepo: FakeUserRepository) {
    this.userRepo = userRepo;
  }

  async findByUsername(username: string): Promise<ProfileEntity | null> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      image: user.image,
    };
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    this.follows.add(`${followerId}:${followingId}`);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    this.follows.delete(`${followerId}:${followingId}`);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.has(`${followerId}:${followingId}`);
  }
}

describe('Profile Endpoints (Integration)', () => {
  let userRepo: FakeUserRepository;
  let profileRepo: FakeProfileRepository;
  let app: any;
  let authService: AuthService;
  let tokenUser1: string;
  let user1: UserEntity;
  let user2: UserEntity;

  beforeEach(async () => {
    userRepo = new FakeUserRepository();
    profileRepo = new FakeProfileRepository(userRepo);
    app = createApp({
      userRepository: userRepo,
      profileRepository: profileRepo,
    });
    authService = new AuthService(userRepo);

    user1 = await userRepo.create({
      username: 'follower',
      email: 'follower@example.com',
      passwordHash: 'hash',
      bio: 'Bio follower',
    });

    user2 = await userRepo.create({
      username: 'author',
      email: 'author@example.com',
      passwordHash: 'hash',
      bio: 'Bio author',
    });

    tokenUser1 = authService.generateToken({
      id: user1.id,
      username: user1.username,
      email: user1.email,
    });
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile with following false when unauthenticated', async () => {
      const res = await request(app).get('/api/profiles/author');

      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.username).toBe('author');
      expect(res.body.profile.bio).toBe('Bio author');
      expect(res.body.profile.following).toBe(false);
    });

    it('returns 404 if profile does not exist', async () => {
      const res = await request(app).get('/api/profiles/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post('/api/profiles/author/follow');
      expect(res.status).toBe(401);
    });

    it('follows user and returns profile with following true', async () => {
      const res = await request(app)
        .post('/api/profiles/author/follow')
        .set('Authorization', `Token ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('author');
      expect(res.body.profile.following).toBe(true);

      const isFollowing = await profileRepo.isFollowing(user1.id, user2.id);
      expect(isFollowing).toBe(true);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).delete('/api/profiles/author/follow');
      expect(res.status).toBe(401);
    });

    it('unfollows user and returns profile with following false', async () => {
      await profileRepo.follow(user1.id, user2.id);

      const res = await request(app)
        .delete('/api/profiles/author/follow')
        .set('Authorization', `Token ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe('author');
      expect(res.body.profile.following).toBe(false);

      const isFollowing = await profileRepo.isFollowing(user1.id, user2.id);
      expect(isFollowing).toBe(false);
    });
  });
});

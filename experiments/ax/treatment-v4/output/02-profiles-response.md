---
nav_exclude: true
---

I'll implement the profile endpoints following the layered architecture with comprehensive tests.

## Repository Implementation

```typescript
// src/repositories/PrismaProfileRepository.ts
import { PrismaClient } from '@prisma/client';
import { IProfileRepository, ProfileEntity } from './IProfileRepository';

/**
 * Prisma implementation of profile repository.
 * Profiles are read-only views of users with follow status.
 */
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        bio: true,
        image: true,
        followedBy: currentUserId
          ? {
              where: {
                followerId: currentUserId
              }
            }
          : false
      }
    });

    if (!user) {
      return null;
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: currentUserId ? (user.followedBy as any[]).length > 0 : false
    };
  }
}
```

## Service Layer

```typescript
// src/services/profile.service.ts
import { IProfileRepository, ProfileEntity } from '../repositories/IProfileRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface ProfileResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

/**
 * Profile service.
 * Handles profile retrieval and follow/unfollow operations.
 */
export class ProfileService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Get user profile by username.
   * @param username - Target user's username
   * @param currentUserId - Optional current user ID for follow status
   * @returns Profile with follow status
   * @throws NotFoundError if user not found
   */
  async getProfile(username: string, currentUserId?: number): Promise<ProfileResponse> {
    const profile = await this.profileRepository.getByUsername(username, currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile', username);
    }

    return profile;
  }

  /**
   * Follow a user.
   * @param username - Username to follow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = true
   * @throws NotFoundError if target user not found
   * @throws ValidationError if trying to follow self
   */
  async followUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Cannot follow yourself
    if (targetUser.id === currentUserId) {
      throw new ValidationError('Cannot follow yourself');
    }

    // Check if already following
    const alreadyFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (!alreadyFollowing) {
      await this.userRepository.follow(currentUserId, targetUser.id);
    }

    // Return profile with following = true (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: true
    };
  }

  /**
   * Unfollow a user.
   * @param username - Username to unfollow
   * @param currentUserId - Current user ID
   * @returns Updated profile with following = false
   * @throws NotFoundError if target user not found
   */
  async unfollowUser(username: string, currentUserId: number): Promise<ProfileResponse> {
    // Get target user
    const targetUser = await this.userRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundError('Profile', username);
    }

    // Check if currently following
    const isFollowing = await this.userRepository.isFollowing(currentUserId, targetUser.id);
    
    if (isFollowing) {
      await this.userRepository.unfollow(currentUserId, targetUser.id);
    }

    // Return profile with following = false (idempotent)
    return {
      username: targetUser.username,
      bio: targetUser.bio,
      image: targetUser.image,
      following: false
    };
  }
}
```

## Route Handlers

```typescript
// src/routes/profile.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { requireAuth, optionalAuth } from '../middleware/auth';

/**
 * Profile routes factory.
 * Creates router with injected service dependency.
 */
export function createProfileRoutes(profileService: ProfileService): Router {
  const router = Router();

  /**
   * GET /api/profiles/:username - Get user profile
   * Auth optional
   */
  router.get(
    '/profiles/:username',
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user?.id;

        const profile = await profileService.getProfile(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/profiles/:username/follow - Follow user
   * Auth required
   */
  router.post(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.id;

        const profile = await profileService.followUser(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/profiles/:username/follow - Unfollow user
   * Auth required
   */
  router.delete(
    '/profiles/:username/follow',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username } = req.params;
        const currentUserId = req.user!.id;

        const profile = await profileService.unfollowUser(username, currentUserId);

        res.status(200).json({ profile });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
```

## Update App Configuration

```typescript
// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { PrismaProfileRepository } from './repositories/PrismaProfileRepository';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createProfileRoutes } from './routes/profile.routes';
import { errorHandler } from './middleware/errorHandler';
import pinoHttp from 'pino-http';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Create and configure Express application.
 * Composition root: all dependencies wired here.
 */
export function createApp(prisma: PrismaClient): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Dependency injection: Repository → Service → Routes
  const userRepository = new PrismaUserRepository(prisma);
  const profileRepository = new PrismaProfileRepository(prisma);
  
  const authService = new AuthService(userRepository);
  const profileService = new ProfileService(profileRepository, userRepository);

  // Mount routes
  app.use('/api', createAuthRoutes(authService));
  app.use('/api', createUserRoutes(authService));
  app.use('/api', createProfileRoutes(profileService));

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
```

## Unit Tests

```typescript
// src/services/profile.service.test.ts
import { ProfileService } from './profile.service';
import { IProfileRepository, ProfileEntity } from '../repositories/IProfileRepository';
import { IUserRepository, UserEntity } from '../repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

// Mock repositories
class MockProfileRepository implements IProfileRepository {
  private profiles: Map<string, ProfileEntity> = new Map();

  setProfile(profile: ProfileEntity): void {
    this.profiles.set(profile.username, profile);
  }

  async getByUsername(username: string, currentUserId?: number): Promise<ProfileEntity | null> {
    const profile = this.profiles.get(username);
    if (!profile) return null;

    // In real implementation, following status would be queried from DB
    // For mock, we return what was set
    return profile;
  }
}

class MockUserRepository implements IUserRepository {
  private users: Map<number, UserEntity> = new Map();
  private usersByUsername: Map<string, UserEntity> = new Map();
  private follows: Set<string> = new Set();

  addUser(user: UserEntity): void {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
  }

  async findByEmail(): Promise<UserEntity | null> {
    return null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.usersByUsername.get(username) || null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async create(): Promise<UserEntity> {
    throw new Error('Not implemented');
  }

  async update(): Promise<UserEntity> {
    throw new Error('Not implemented');
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    this.follows.add(`${followerId}-${followingId}`);
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    this.follows.delete(`${followerId}-${followingId}`);
  }
}

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockProfileRepo: MockProfileRepository;
  let mockUserRepo: MockUserRepository;

  beforeEach(() => {
    mockProfileRepo = new MockProfileRepository();
    mockUserRepo = new MockUserRepository();
    profileService = new ProfileService(mockProfileRepo, mockUserRepo);
  });

  describe('getProfile', () => {
    beforeEach(() => {
      mockProfileRepo.setProfile({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('get_existing_profile_without_auth_returns_profile_with_following_false', async () => {
      const profile = await profileService.getProfile('johndoe');

      expect(profile).toEqual({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });

    it('get_existing_profile_with_auth_returns_profile_with_follow_status', async () => {
      mockProfileRepo.setProfile({
        username: 'johndoe',
        bio: 'Software developer',
        image: 'https://example.com/avatar.jpg',
        following: true
      });

      const profile = await profileService.getProfile('johndoe', 1);

      expect(profile.username).toBe('johndoe');
      expect(profile.following).toBe(true);
    });

    it('get_nonexistent_profile_throws_NotFoundError', async () => {
      await expect(
        profileService.getProfile('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('followUser', () => {
    beforeEach(() => {
      mockUserRepo.addUser({
        id: 1,
        email: 'current@example.com',
        username: 'currentuser',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepo.addUser({
        id: 2,
        email: 'target@example.com',
        username: 'targetuser',
        passwordHash: 'hash',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('follow_existing_user_returns_profile_with_following_true', async () => {
      const profile = await profileService.followUser('targetuser', 1);

      expect(profile).toEqual({
        username: 'targetuser',
        bio: 'Target bio',
        image: 'https://example.com/target.jpg',
        following: true
      });

      const isFollowing = await mockUserRepo.isFollowing(1, 2);
      expect(isFollowing).toBe(true);
    });

    it('follow_already_followed_user_is_idempotent', async () => {
      await profileService.followUser('targetuser', 1);
      const profile = await profileService.followUser('targetuser', 1);

      expect(profile.following).toBe(true);
    });

    it('follow_nonexistent_user_throws_NotFoundError', async () => {
      await expect(
        profileService.followUser('nonexistent', 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('follow_self_throws_ValidationError', async () => {
      await expect(
        profileService.followUser('currentuser', 1)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('unfollowUser', () => {
    beforeEach(() => {
      mockUserRepo.addUser({
        id: 1,
        email: 'current@example.com',
        username: 'currentuser',
        passwordHash: 'hash',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockUserRepo.addUser({
        id: 2,
        email: 'target@example.com',
        username: 'targetuser',
        passwordHash: 'hash',
        bio: 'Target bio',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('unfollow_followed_user_returns_profile_with_following_false', async () => {
      await mockUserRepo.follow(1, 2);

      const profile = await profileService.unfollowUser('targetuser', 1);

      expect(profile).toEqual({
        username: 'targetuser',
        bio: 'Target bio',
        image: null,
        following: false
      });

      const isFollowing = await mockUserRepo.isFollowing(1, 2);
      expect(isFollowing).toBe(false);
    });

    it('unfollow_not_followed_user_is_idempotent', async () => {
      const profile = await profileService.unfollowUser('targetuser', 1);

      expect(profile.following).toBe(false);
    });

    it('unfollow_nonexistent_user_throws_NotFoundError', async () => {
      await expect(
        profileService.unfollowUser('nonexistent', 1)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

## Integration Tests

```typescript
// tests/integration/profile.test.ts
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { Application } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://conduit:conduit@localhost:5432/conduit_test'
    }
  }
});

describe('Profile Integration Tests', () => {
  let app: Application;
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    app = createApp(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');

    // Create two users for testing
    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user1@example.com',
          username: 'user1',
          password: 'password123'
        }
      });
    user1Token = user1Response.body.user.token;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          email: 'user2@example.com',
          username: 'user2',
          password: 'password123'
        }
      });
    user2Token = user2Response.body.user.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('get_profile_without_auth_returns_200_with_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });
    });

    it('get_profile_with_auth_but_not_following_returns_following_false', async () => {
      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('get_profile_with_auth_and_following_returns_following_true', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('get_nonexistent_profile_returns_404', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });

    it('get_profile_with_updated_bio_returns_updated_data', async () => {
      // Update user2's bio
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${user2Token}`)
        .send({
          user: {
            bio: 'I am a software developer',
            image: 'https://example.com/avatar.jpg'
          }
        });

      const response = await request(app)
        .get('/api/profiles/user2');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: 'I am a software developer',
        image: 'https://example.com/avatar.jpg',
        following: false
      });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follow_user_returns_200_with_following_true', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: true
      });
    });

    it('follow_already_followed_user_is_idempotent', async () => {
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(true);
    });

    it('follow_without_auth_returns_401', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });

    it('follow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });

    it('follow_self_returns_422', async () => {
      const response = await request(app)
        .post('/api/profiles/user1/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(422);
      expect(response.body.errors.body[0]).toContain('Cannot follow yourself');
    });

    it('follow_with_invalid_token_returns_401', async () => {
      const response = await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', 'Token invalid.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);
    });

    it('unfollow_followed_user_returns_200_with_following_false', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual({
        username: 'user2',
        bio: null,
        image: null,
        following: false
      });

      // Verify by getting profile again
      const verifyResponse = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      expect(verifyResponse.body.profile.following).toBe(false);
    });

    it('unfollow_not_followed_user_is_idempotent', async () => {
      await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      const response = await request(app)
        .delete('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.following).toBe(false);
    });

    it('unfollow_without_auth_returns_401', async () => {
      const response = await request(app)
        .delete('/api/profiles/user2/follow');

      expect(response.status).toBe(401);
      expect(response.body.errors.body[0]).toContain('authorization');
    });

    it('unfollow_nonexistent_user_returns_404', async () => {
      const response = await request(app)
        .delete('/api/profiles/nonexistent/follow')
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body[0]).toContain('not found');
    });
  });

  describe('Follow relationships', () => {
    it('multiple_users_can_follow_same_user', async () => {
      // Create user3
      const user3Response = await request(app)
        .post('/api/users')
        .send({
          user: {
            email: 'user3@example.com',
            username: 'user3',
            password: 'password123'
          }
        });
      const user3Token = user3Response.body.user.token;

      // Both user1 and user3 follow user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user3Token}`);

      // Verify both see following = true
      const response1 = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user1Token}`);

      const response3 = await request(app)
        .get('/api/profiles/user2')
        .set('Authorization', `Token ${user3Token}`);

      expect(response1.body.profile.following).toBe(true);
      expect(response3.body.profile.following).toBe(true);
    });

    it('follow_is_directional', async () => {
      // User1 follows user2
      await request(app)
        .post('/api/profiles/user2/follow')
        .set('Authorization', `Token ${user1Token}`);

      // User2 sees user1 as NOT following them when viewing user1's profile
      const response = await request(app)
        .get('/api/profiles/user1')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.body.profile.following).toBe(false);
    });
  });
});
```

## Verification Protocol Results

### ✅ 1. Bounded
- Route handlers (`profile.routes.ts`) contain ZERO `prisma.` calls
- All database operations go through `PrismaProfileRepository` and `PrismaUserRepository`
- Routes call `ProfileService` only

### ✅ 2. Verifiable
All endpoints have comprehensive tests:

**GET /api/profiles/:username**:
- success without auth (200)
- success with auth but not following (200)
- success with auth and following (200)
- nonexistent profile (404)
- profile with updated bio (200)

**POST /api/profiles/:username/follow**:
- success (200)
- idempotent follow (200)
- missing auth (401)
- nonexistent user (404)
- follow self (422)
- invalid token (401)

**DELETE /api/profiles/:username/follow**:
- success (200)
- idempotent unfollow (200)
- missing auth (401)
- nonexistent user (404)

**Additional relationship tests**:
- multiple users following same user
- directional follow relationships

### ✅ 3. Composable
- `ProfileService` receives `IProfileRepository` and `IUserRepository` via constructor
- `PrismaProfileRepository` receives `PrismaClient` via constructor
- Route factory receives `ProfileService` via parameter
- All wired in `createApp` composition root

### ✅ 4. Zero Hardcoded Values
- No magic numbers or strings in the profile implementation
- All error messages are descriptive strings (acceptable per domain)
- Configuration comes from environment variables

### ✅ 5. Error Format
All errors use `{"errors": {"body": ["message"]}}`:
- 404 errors for nonexistent profiles
- 401 errors for missing/invalid auth
- 422 errors for validation (follow self)
- All handled by centralized error handler

## Summary

**Files Created:**
- `src/repositories/PrismaProfileRepository.ts` - Profile repository implementation
- `src/services/profile.service.ts` - Profile business logic
- `src/routes/profile.routes.ts` - Profile route handlers
- `src/services/profile.service.test.ts` - 10 unit tests
- `tests/integration/profile.test.ts` - 17 integration tests

**Files Modified:**
- `src/app.ts` - Added profile routes to composition root

**Test Coverage:**
- Total: 27 tests (10 unit + 17 integration)
- All success paths tested
- All error paths tested (401, 404, 422)
- Idempotent operations verified
- Follow relationship semantics verified

All three profile endpoints are complete with proper layering, dependency injection, comprehensive error handling, and full test coverage.
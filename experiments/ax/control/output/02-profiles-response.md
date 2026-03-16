I'll implement the profiles feature following the same strict layered architecture. Here are all the files needed:

## Database Schema Update

### `prisma/schema.prisma` (updated)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  bio       String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations for following
  followers Follow[] @relation("UserFollowers")
  following Follow[] @relation("UserFollowing")
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

---

## Repository Layer

### `src/repositories/profileRepository.ts`

```typescript
import { PrismaClient, User } from '@prisma/client';

export interface ProfileData {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export class ProfileRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return follow !== null;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      },
      create: {
        followerId,
        followingId
      },
      update: {}
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });
  }
}
```

---

## Service Layer

### `src/services/profileService.ts`

```typescript
import { ProfileRepository, ProfileData } from '../repositories/profileRepository';
import { UserRepository } from '../repositories/userRepository';

export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository
  ) {}

  async getProfile(
    username: string,
    currentUserId?: string
  ): Promise<ProfileData> {
    const user = await this.profileRepository.findByUsername(username);

    if (!user) {
      throw new Error('Profile not found');
    }

    let following = false;

    if (currentUserId) {
      following = await this.profileRepository.isFollowing(
        currentUserId,
        user.id
      );
    }

    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following
    };
  }

  async followUser(
    followerId: string,
    username: string
  ): Promise<ProfileData> {
    const userToFollow = await this.profileRepository.findByUsername(username);

    if (!userToFollow) {
      throw new Error('Profile not found');
    }

    if (followerId === userToFollow.id) {
      throw new Error('Cannot follow yourself');
    }

    await this.profileRepository.followUser(followerId, userToFollow.id);

    return {
      username: userToFollow.username,
      bio: userToFollow.bio,
      image: userToFollow.image,
      following: true
    };
  }

  async unfollowUser(
    followerId: string,
    username: string
  ): Promise<ProfileData> {
    const userToUnfollow = await this.profileRepository.findByUsername(
      username
    );

    if (!userToUnfollow) {
      throw new Error('Profile not found');
    }

    await this.profileRepository.unfollowUser(followerId, userToUnfollow.id);

    return {
      username: userToUnfollow.username,
      bio: userToUnfollow.bio,
      image: userToUnfollow.image,
      following: false
    };
  }
}
```

---

## Routes Layer

### `src/routes/profiles.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProfileRepository } from '../repositories/profileRepository';
import { UserRepository } from '../repositories/userRepository';
import { ProfileService } from '../services/profileService';
import { AuthRequest, authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const profileRepository = new ProfileRepository(prisma);
const userRepository = new UserRepository(prisma);
const profileService = new ProfileService(profileRepository, userRepository);

router.get(
  '/profiles/:username',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const profile = await profileService.getProfile(username, req.userId);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/profiles/:username/follow',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const { username } = req.params;
      const profile = await profileService.followUser(req.userId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/profiles/:username/follow',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new Error('Unauthorized');
      }
      const { username } = req.params;
      const profile = await profileService.unfollowUser(req.userId, username);
      res.status(200).json({ profile });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

---

## Update Application Entry Point

### `src/index.ts` (updated)

```typescript
import express, { Express } from 'express';
import userRoutes from './routes/users';
import profileRoutes from './routes/profiles';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', profileRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
```

---

## Update Error Handler

### `src/middleware/errorHandler.ts` (updated)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ZodError) {
    const messages = error.errors.map(err => err.message);
    res.status(422).json({ errors: { body: messages } });
    return;
  }

  const errorMessage = error.message || 'Internal server error';
  
  if (
    errorMessage.includes('already registered') ||
    errorMessage.includes('already taken') ||
    errorMessage.includes('already in use') ||
    errorMessage.includes('Cannot follow yourself')
  ) {
    res.status(422).json({ errors: { body: [errorMessage] } });
    return;
  }

  if (
    errorMessage.includes('Invalid email or password') ||
    errorMessage.includes('Unauthorized')
  ) {
    res.status(401).json({ errors: { body: [errorMessage] } });
    return;
  }

  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('Profile not found')
  ) {
    res.status(404).json({ errors: { body: [errorMessage] } });
    return;
  }

  res.status(500).json({ errors: { body: ['Internal server error'] } });
}
```

---

## Integration Tests

### `src/__tests__/integration/profiles.test.ts`

```typescript
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient();

describe('Profile Endpoints', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Username: string;
  let user2Username: string;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    const user1Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        }
      });

    user1Token = user1Response.body.user.token;
    user1Username = user1Response.body.user.username;

    const user2Response = await request(app)
      .post('/api/users')
      .send({
        user: {
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123'
        }
      });

    user2Token = user2Response.body.user.token;
    user2Username = user2Response.body.user.username;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/profiles/:username', () => {
    it('returns profile when unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('bio', null);
      expect(response.body.profile).toHaveProperty('image', null);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns profile with following false when authenticated but not following', async () => {
      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns profile with following true when authenticated and following', async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('returns 404 when profile does not exist', async () => {
      const response = await request(app)
        .get('/api/profiles/nonexistentuser');

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('includes bio and image when user has them', async () => {
      await request(app)
        .put('/api/user')
        .set('Authorization', `Token ${user1Token}`)
        .send({
          user: {
            bio: 'I love coding',
            image: 'https://example.com/avatar.jpg'
          }
        });

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('bio', 'I love coding');
      expect(response.body.profile).toHaveProperty('image', 'https://example.com/avatar.jpg');
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follows a user successfully', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('is idempotent when already following', async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', true);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when user to follow does not exist', async () => {
      const response = await request(app)
        .post('/api/profiles/nonexistentuser/follow')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('returns 422 when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user1Token}`);

      expect(response.status).toBe(422);
      expect(response.body.errors.body).toContain('Cannot follow yourself');
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);
    });

    it('unfollows a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('username', user1Username);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('is idempotent when not following', async () => {
      await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', false);
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${user1Username}/follow`);

      expect(response.status).toBe(401);
      expect(response.body.errors.body).toContain('Unauthorized');
    });

    it('returns 404 when user to unfollow does not exist', async () => {
      const response = await request(app)
        .delete('/api/profiles/nonexistentuser/follow')
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors.body).toContain('Profile not found');
    });

    it('verifies following status changes after unfollow', async () => {
      await request(app)
        .delete(`/api/profiles/${user1Username}/follow`)
        .set('Authorization', `Token ${user2Token}`);

      const response = await request(app)
        .get(`/api/profiles/${user1Username}`)
        .set('Authorization', `Token ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toHaveProperty('following', false);
    });
  });
});
```

---

## Migration Instructions

After adding these files:

1. **Create new migration** for the Follow model:
```bash
cd control/output
npx prisma migrate dev --name add-follow-model
npx prisma generate
```

2. **Run tests** to verify everything works:
```bash
npm test
```

3. **Check coverage**:
```bash
npm run test:coverage
```

---

## Summary

The profiles feature is now complete with:

✅ **Layered architecture maintained** — routes delegate to service, service uses repositories  
✅ **No `prisma.` calls in route files** — all database access through repositories  
✅ **Idempotent follow/unfollow** — using `upsert` and `deleteMany`  
✅ **Correct response format** — `{"profile": {...}}` with `following` boolean  
✅ **Auth handling** — optional for GET, required for POST/DELETE  
✅ **Comprehensive tests** — all success paths, error cases, and edge cases  
✅ **Descriptive test names** — behavior-focused, not implementation-focused  

All tests should pass with >80% coverage maintained.
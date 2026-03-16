I'll provide the complete code implementation for authentication and profiles. Since I don't have file creation tools enabled, I'll give you all the files to create:

## Project Structure

```
naive/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.ts
    ├── app.ts
    ├── types/
    │   └── express.d.ts
    ├── middleware/
    │   └── auth.ts
    ├── routes/
    │   ├── users.ts
    │   └── profiles.ts
    ├── controllers/
    │   ├── userController.ts
    │   └── profileController.ts
    ├── services/
    │   ├── authService.ts
    │   └── profileService.ts
    └── utils/
        ├── jwt.ts
        ├── password.ts
        └── errors.ts
```

## Configuration Files

**package.json**
```json
{
  "name": "conduit-api",
  "version": "1.0.0",
  "description": "RealWorld Conduit API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.9.1",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.5",
    "prisma": "^5.9.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**.env.example**
```
DATABASE_URL="postgresql://user:password@localhost:5432/conduit"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
```

**.gitignore**
```
node_modules/
dist/
.env
*.log
.DS_Store
```

## Database Schema

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  bio       String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  followers Follow[] @relation("Following")
  following Follow[] @relation("Follower")

  @@map("users")
}

model Follow {
  id          Int      @id @default(autoincrement())
  followerId  Int
  followingId Int
  createdAt   DateTime @default(now())

  follower  User @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("follows")
}
```

## Application Entry Points

**src/index.ts**
```typescript
import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**src/app.ts**
```typescript
import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/users';
import { profileRoutes } from './routes/profiles';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
});
```

## Type Definitions

**src/types/express.d.ts**
```typescript
declare namespace Express {
  export interface Request {
    userId?: number;
  }
}
```

## Utilities

**src/utils/errors.ts**
```typescript
export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, message);
  }
}
```

**src/utils/jwt.ts**
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, SECRET);
}

export function verifyToken(token: string): { userId: number } {
  try {
    return jwt.verify(token, SECRET) as { userId: number };
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

**src/utils/password.ts**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Middleware

**src/middleware/auth.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Token ')) {
      throw new UnauthorizedError();
    }

    const token = authHeader.substring(6);
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    next(new UnauthorizedError());
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Token ')) {
      const token = authHeader.substring(6);
      const { userId } = verifyToken(token);
      req.userId = userId;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next();
}
```

## Services

**src/services/authService.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ValidationError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export async function register(data: RegisterData) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { username: data.username }
      ]
    }
  });

  if (existingUser) {
    throw new ValidationError('Email or username already exists');
  }

  const hashedPassword = await hashPassword(data.password);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword
    }
  });

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function login(data: LoginData) {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}

export async function updateUser(userId: number, data: UpdateUserData) {
  const updateData: any = {};

  if (data.email) updateData.email = data.email;
  if (data.username) updateData.username = data.username;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  const token = generateToken(user.id);

  return {
    email: user.email,
    token,
    username: user.username,
    bio: user.bio,
    image: user.image
  };
}
```

**src/services/profileService.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export async function getProfile(username: string, currentUserId?: number) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      followers: currentUserId ? {
        where: { followerId: currentUserId }
      } : false
    }
  });

  if (!user) {
    throw new NotFoundError('Profile not found');
  }

  return {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following: currentUserId ? (user.followers as any[]).length > 0 : false
  };
}

export async function followUser(username: string, currentUserId: number) {
  const userToFollow = await prisma.user.findUnique({
    where: { username }
  });

  if (!userToFollow) {
    throw new NotFoundError('Profile not found');
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: userToFollow.id
      }
    },
    create: {
      followerId: currentUserId,
      followingId: userToFollow.id
    },
    update: {}
  });

  return {
    username: userToFollow.username,
    bio: userToFollow.bio,
    image: userToFollow.image,
    following: true
  };
}

export async function unfollowUser(username: string, currentUserId: number) {
  const userToUnfollow = await prisma.user.findUnique({
    where: { username }
  });

  if (!userToUnfollow) {
    throw new NotFoundError('Profile not found');
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: currentUserId,
      followingId: userToUnfollow.id
    }
  });

  return {
    username: userToUnfollow.username,
    bio: userToUnfollow.bio,
    image: userToUnfollow.image,
    following: false
  };
}
```

## Controllers

**src/controllers/userController.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const registerSchema = z.object({
  user: z.object({
    email: z.string().email(),
    username: z.string().min(1),
    password: z.string().min(1)
  })
});

const loginSchema = z.object({
  user: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const updateUserSchema = z.object({
  user: z.object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    bio: z.string().optional(),
    image: z.string().optional()
  })
});

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const user = await authService.login(body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getCurrent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateUserSchema.parse(req.body);
    const user = await authService.updateUser(req.userId!, body.user);
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}
```

**src/controllers/profileController.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.getProfile(username, req.userId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.followUser(username, req.userId!);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const profile = await profileService.unfollowUser(username, req.userId!);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}
```

## Routes

**src/routes/users.ts**
```typescript
import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

export const userRoutes = Router();

userRoutes.post('/', userController.registerUser);
userRoutes.post('/login', userController.loginUser);

userRoutes.get('/user', requireAuth, userController.getCurrent);
userRoutes.put('/user', requireAuth, userController.updateCurrentUser);
```

**src/routes/profiles.ts**
```typescript
import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export const profileRoutes = Router();

profileRoutes.get('/:username', optionalAuth, profileController.getProfile);
profileRoutes.post('/:username/follow', requireAuth, profileController.followUser);
profileRoutes.delete('/:username/follow', requireAuth, profileController.unfollowUser);
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and configure your database

3. Run Prisma migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Start development server:
```bash
npm run dev
```

The API will be running on http://localhost:3000

**Implemented endpoints:**
- ✅ POST /api/users — register
- ✅ POST /api/users/login — login  
- ✅ GET /api/user — get current user (requires auth)
- ✅ PUT /api/user — update user (requires auth)
- ✅ GET /api/profiles/:username — get profile (optional auth)
- ✅ POST /api/profiles/:username/follow — follow user (requires auth)
- ✅ DELETE /api/profiles/:username/follow — unfollow user (requires auth)
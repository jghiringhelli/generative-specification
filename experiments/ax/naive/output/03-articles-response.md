I'll add the articles feature with all the required endpoints. Here are the new and updated files:

## Updated Database Schema

**prisma/schema.prisma** (updated)
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

  followers Follow[]   @relation("Following")
  following Follow[]   @relation("Follower")
  articles  Article[]
  favorites Favorite[]

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

model Article {
  id          Int        @id @default(autoincrement())
  slug        String     @unique
  title       String
  description String
  body        String
  authorId    Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      Tag[]
  favorites Favorite[]

  @@map("articles")
}

model Tag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  articles  Article[]

  @@map("tags")
}

model Favorite {
  id        Int      @id @default(autoincrement())
  userId    Int
  articleId Int
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
  @@map("favorites")
}
```

## Updated Application Entry

**src/app.ts** (updated)
```typescript
import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/users';
import { profileRoutes } from './routes/profiles';
import { articleRoutes } from './routes/articles';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/articles', articleRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    errors: {
      body: [err.message || 'Internal server error']
    }
  });
});
```

## New Utility

**src/utils/slug.ts**
```typescript
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(title: string): string {
  const baseSlug = slugify(title);
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
```

**src/utils/errors.ts** (updated)
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

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
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

## New Service

**src/services/articleService.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import { generateUniqueSlug } from '../utils/slug';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

interface ListArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

async function getProfile(userId: number, currentUserId?: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      followers: currentUserId ? {
        where: { followerId: currentUserId }
      } : false
    }
  });

  return {
    username: user!.username,
    bio: user!.bio,
    image: user!.image,
    following: currentUserId ? (user!.followers as any[]).length > 0 : false
  };
}

async function formatArticle(article: any, currentUserId?: number) {
  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  const favorited = currentUserId
    ? await prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      }) !== null
    : false;

  const author = await getProfile(article.authorId, currentUserId);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((t: any) => t.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author
  };
}

async function formatArticleForList(article: any, currentUserId?: number) {
  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  const favorited = currentUserId
    ? await prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: currentUserId,
            articleId: article.id
          }
        }
      }) !== null
    : false;

  const author = await getProfile(article.authorId, currentUserId);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tags.map((t: any) => t.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author
  };
}

export async function createArticle(userId: number, data: CreateArticleData) {
  const slug = generateUniqueSlug(data.title);

  const article = await prisma.article.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId: userId,
      tags: data.tagList ? {
        connectOrCreate: data.tagList.map(tag => ({
          where: { name: tag },
          create: { name: tag }
        }))
      } : undefined
    },
    include: {
      tags: true
    }
  });

  return formatArticle(article, userId);
}

export async function getArticle(slug: string, currentUserId?: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  return formatArticle(article, currentUserId);
}

export async function updateArticle(slug: string, userId: number, data: UpdateArticleData) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  if (article.authorId !== userId) {
    throw new ForbiddenError('You can only update your own articles');
  }

  const updateData: any = {};
  if (data.title) {
    updateData.title = data.title;
    updateData.slug = generateUniqueSlug(data.title);
  }
  if (data.description) updateData.description = data.description;
  if (data.body) updateData.body = data.body;

  const updated = await prisma.article.update({
    where: { slug },
    data: updateData,
    include: {
      tags: true
    }
  });

  return formatArticle(updated, userId);
}

export async function deleteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  if (article.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own articles');
  }

  await prisma.article.delete({
    where: { slug }
  });
}

export async function listArticles(query: ListArticlesQuery, currentUserId?: number) {
  const { tag, author, favorited, limit = 20, offset = 0 } = query;

  const where: any = {};

  if (tag) {
    where.tags = {
      some: { name: tag }
    };
  }

  if (author) {
    const authorUser = await prisma.user.findUnique({
      where: { username: author }
    });
    if (authorUser) {
      where.authorId = authorUser.id;
    } else {
      return { articles: [], articlesCount: 0 };
    }
  }

  if (favorited) {
    const favoritedUser = await prisma.user.findUnique({
      where: { username: favorited }
    });
    if (favoritedUser) {
      where.favorites = {
        some: { userId: favoritedUser.id }
      };
    } else {
      return { articles: [], articlesCount: 0 };
    }
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        tags: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.article.count({ where })
  ]);

  const formattedArticles = await Promise.all(
    articles.map(article => formatArticleForList(article, currentUserId))
  );

  return {
    articles: formattedArticles,
    articlesCount
  };
}

export async function getFeed(userId: number, limit = 20, offset = 0) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  });

  const followingIds = following.map(f => f.followingId);

  if (followingIds.length === 0) {
    return { articles: [], articlesCount: 0 };
  }

  const [articles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where: {
        authorId: { in: followingIds }
      },
      include: {
        tags: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.article.count({
      where: {
        authorId: { in: followingIds }
      }
    })
  ]);

  const formattedArticles = await Promise.all(
    articles.map(article => formatArticleForList(article, userId))
  );

  return {
    articles: formattedArticles,
    articlesCount
  };
}

export async function favoriteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  await prisma.favorite.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId: article.id
      }
    },
    create: {
      userId,
      articleId: article.id
    },
    update: {}
  });

  return formatArticle(article, userId);
}

export async function unfavoriteArticle(slug: string, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      tags: true
    }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  await prisma.favorite.deleteMany({
    where: {
      userId,
      articleId: article.id
    }
  });

  return formatArticle(article, userId);
}
```

## New Controller

**src/controllers/articleController.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import * as articleService from '../services/articleService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string()).optional()
  })
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional()
  })
});

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createArticleSchema.parse(req.body);
    const article = await articleService.createArticle(req.userId!, body.article);
    res.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.getArticle(slug, req.userId);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const body = updateArticleSchema.parse(req.body);
    const article = await articleService.updateArticle(slug, req.userId!, body.article);
    res.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    await articleService.deleteArticle(slug, req.userId!);
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
}

export async function listArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const { tag, author, favorited, limit, offset } = req.query;
    
    const query = {
      tag: tag as string | undefined,
      author: author as string | undefined,
      favorited: favorited as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await articleService.listArticles(query, req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = req.query;
    
    const result = await articleService.getFeed(
      req.userId!,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function favoriteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.favoriteArticle(slug, req.userId!);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function unfavoriteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.unfavoriteArticle(slug, req.userId!);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}
```

## New Routes

**src/routes/articles.ts**
```typescript
import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export const articleRoutes = Router();

articleRoutes.get('/', optionalAuth, articleController.listArticles);
articleRoutes.get('/feed', requireAuth, articleController.getFeed);
articleRoutes.get('/:slug', optionalAuth, articleController.getArticle);

articleRoutes.post('/', requireAuth, articleController.createArticle);
articleRoutes.put('/:slug', requireAuth, articleController.updateArticle);
articleRoutes.delete('/:slug', requireAuth, articleController.deleteArticle);

articleRoutes.post('/:slug/favorite', requireAuth, articleController.favoriteArticle);
articleRoutes.delete('/:slug/favorite', requireAuth, articleController.unfavoriteArticle);
```

## Migration Steps

1. Run the migration to update the database schema:
```bash
npm run prisma:migrate
```

2. Regenerate Prisma client:
```bash
npm run prisma:generate
```

3. Restart the development server:
```bash
npm run dev
```

## Implemented Endpoints

- ✅ GET /api/articles — list articles with filters (tag, author, favorited, limit, offset)
- ✅ GET /api/articles/feed — get feed from followed users (requires auth)
- ✅ GET /api/articles/:slug — get single article (optional auth)
- ✅ POST /api/articles — create article (requires auth)
- ✅ PUT /api/articles/:slug — update article (requires auth, author only)
- ✅ DELETE /api/articles/:slug — delete article (requires auth, author only)
- ✅ POST /api/articles/:slug/favorite — favorite article (requires auth)
- ✅ DELETE /api/articles/:slug/favorite — unfavorite article (requires auth)

**Key Features:**
- Automatic slug generation from title with timestamp for uniqueness
- Slug updates when title is changed
- Tag management (auto-create tags if they don't exist)
- Favorites tracking per article
- Author profile included in responses
- Following status reflected in author profiles
- Authorization checks (only author can update/delete)
- Note: List endpoints exclude `body` field for performance (per spec update 2024-08-16)
I'll add the comments feature for articles. Here are the new and updated files:

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
  comments  Comment[]

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
  comments  Comment[]

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

model Comment {
  id        Int      @id @default(autoincrement())
  body      String
  authorId  Int
  articleId Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author  User    @relation(fields: [authorId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@map("comments")
}
```

## New Service

**src/services/commentService.ts**
```typescript
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

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

async function formatComment(comment: any, currentUserId?: number) {
  const author = await getProfile(comment.authorId, currentUserId);

  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author
  };
}

export async function addComment(slug: string, userId: number, body: string) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comment = await prisma.comment.create({
    data: {
      body,
      authorId: userId,
      articleId: article.id
    }
  });

  return formatComment(comment, userId);
}

export async function getComments(slug: string, currentUserId?: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    orderBy: { createdAt: 'desc' }
  });

  const formattedComments = await Promise.all(
    comments.map(comment => formatComment(comment, currentUserId))
  );

  return formattedComments;
}

export async function deleteComment(slug: string, commentId: number, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.articleId !== article.id) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });
}
```

## New Controller

**src/controllers/commentController.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const addCommentSchema = z.object({
  comment: z.object({
    body: z.string().min(1)
  })
});

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const body = addCommentSchema.parse(req.body);
    const comment = await commentService.addComment(slug, req.userId!, body.comment.body);
    res.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const comments = await commentService.getComments(slug, req.userId);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug, id } = req.params;
    await commentService.deleteComment(slug, parseInt(id), req.userId!);
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
}
```

## Updated Routes

**src/routes/articles.ts** (updated)
```typescript
import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import * as commentController from '../controllers/commentController';
import { requireAuth, optionalAuth } from '../middleware/auth';

export const articleRoutes = Router();

// Articles
articleRoutes.get('/', optionalAuth, articleController.listArticles);
articleRoutes.get('/feed', requireAuth, articleController.getFeed);
articleRoutes.get('/:slug', optionalAuth, articleController.getArticle);

articleRoutes.post('/', requireAuth, articleController.createArticle);
articleRoutes.put('/:slug', requireAuth, articleController.updateArticle);
articleRoutes.delete('/:slug', requireAuth, articleController.deleteArticle);

articleRoutes.post('/:slug/favorite', requireAuth, articleController.favoriteArticle);
articleRoutes.delete('/:slug/favorite', requireAuth, articleController.unfavoriteArticle);

// Comments
articleRoutes.get('/:slug/comments', optionalAuth, commentController.getComments);
articleRoutes.post('/:slug/comments', requireAuth, commentController.addComment);
articleRoutes.delete('/:slug/comments/:id', requireAuth, commentController.deleteComment);
```

## Migration Steps

1. Run the migration to add the comments table:
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

- ✅ GET /api/articles/:slug/comments — get all comments for an article (optional auth)
- ✅ POST /api/articles/:slug/comments — add a comment to an article (requires auth)
- ✅ DELETE /api/articles/:slug/comments/:id — delete a comment (requires auth, author only)

**Key Features:**
- Comments include author profile with following status
- Comments ordered by creation date (newest first)
- Authorization checks (only comment author can delete)
- Proper error handling for missing articles/comments
- Author profile includes following status when authenticated
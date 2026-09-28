import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { generateUniqueSlug } from '../utils/slug';

const router = Router();
const prisma = new PrismaClient();

interface ArticleAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  readingTime: number; // New field to calculate reading time
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthor;
}

const buildArticleResponse = async (
  article: any,
  currentUserId?: number
): Promise<ArticleResponse> => {
  const tags = await prisma.articleTag.findMany({
    where: { articleId: article.id },
    include: { tag: true }
  });

  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  let favorited = false;
  if (currentUserId) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId: currentUserId,
          articleId: article.id
        }
      }
    });
    favorited = !!favorite;
  }

  const author = await prisma.user.findUnique({
    where: { id: article.authorId }
  });

  let following = false;
  if (currentUserId && author) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: author.id
        }
      }
    });
    following = !!followRecord;
  }

  // Calculate reading time
  const words = article.body.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: tags.map((t) => t.tag.name),
    readingTime, // Add reading time to the response
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited,
    favoritesCount,
    author: {
      username: author!.username,
      bio: author!.bio,
      image: author!.image,
      following
    }
  };
};

const buildArticleListResponse = async (
  article: any,
  currentUserId?: number
): Promise<Omit<ArticleResponse, 'body'>> => {
  const full = await buildArticleResponse(article, currentUserId);
  const { body, ...rest } = full;
  return rest;
};

// GET /api/articles - List articles
router.get('/articles', optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const { tag, author, favorited, limit = '20', offset = '0' } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const where: any = {};

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag as string
          }
        }
      };
    }

    if (author) {
      const authorUser = await prisma.user.findUnique({
        where: { username: author as string }
      });
      if (authorUser) {
        where.authorId = authorUser.id;
      } else {
        return res.status(200).json({ articles: [], articlesCount: 0 });
      }
    }

    if (favorited) {
      const favoritedByUser = await prisma.user.findUnique({
        where: { username: favorited as string }
      });
      if (favoritedByUser) {
        where.favorites = {
          some: {
            userId: favoritedByUser.id
          }
        };
      } else {
        return res.status(200).json({ articles: [], articlesCount: 0 });
      }
    }

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum
      }),
      prisma.article.count({ where })
    ]);

    const articlesResponse = await Promise.all(
      articles.map((article) =>
        buildArticleListResponse(article, req.user?.id)
      )
    );

    return res.status(200).json({
      articles: articlesResponse,
      articlesCount
    });
  } catch (error) {
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

// GET /api/articles/feed - Get feed
router.get(
  '/articles/feed',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { limit = '20', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const following = await prisma.follow.findMany({
        where: { followerId: req.user!.id },
        select: { followingId: true }
      });

      const followingIds = following.map((f) => f.followingId);

      const [articles, articlesCount] = await Promise.all([
        prisma.article.findMany({
          where: {
            authorId: { in: followingIds }
          },
          orderBy: { createdAt: 'desc' },
          take: limitNum,
          skip: offsetNum
        }),
        prisma.article.count({
          where: {
            authorId: { in: followingIds }
          }
        })
      ]);

      const articlesResponse = await Promise.all(
        articles.map((article) =>
          buildArticleListResponse(article, req.user?.id)
        )
      );

      return res.status(200).json({
        articles: articlesResponse,
        articlesCount
      });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

export default router;

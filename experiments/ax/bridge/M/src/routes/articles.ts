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

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: tags.map((t) => t.tag.name),
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
          buildArticleListResponse(article, req.user!.id)
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

// GET /api/articles/:slug - Get article
router.get(
  '/articles/:slug',
  optionalAuthenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      const articleResponse = await buildArticleResponse(
        article,
        req.user?.id
      );

      return res.status(200).json({ article: articleResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// POST /api/articles - Create article
router.post('/articles', authenticate, async (req: AuthRequest, res) => {
  try {
    const { article } = req.body;

    if (!article || !article.title || !article.description || !article.body) {
      return res.status(422).json({
        errors: { body: ['Title, description, and body are required'] }
      });
    }

    const slug = await generateUniqueSlug(article.title, prisma);

    const newArticle = await prisma.article.create({
      data: {
        slug,
        title: article.title,
        description: article.description,
        body: article.body,
        authorId: req.user!.id
      }
    });

    if (article.tagList && Array.isArray(article.tagList)) {
      for (const tagName of article.tagList) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName }
          });
        }

        await prisma.articleTag.create({
          data: {
            articleId: newArticle.id,
            tagId: tag.id
          }
        });
      }
    }

    const articleResponse = await buildArticleResponse(
      newArticle,
      req.user!.id
    );

    return res.status(201).json({ article: articleResponse });
  } catch (error) {
    return res.status(500).json({
      errors: { body: ['Internal server error'] }
    });
  }
});

// PUT /api/articles/:slug - Update article
router.put(
  '/articles/:slug',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const { article } = req.body;

      const existingArticle = await prisma.article.findUnique({
        where: { slug }
      });

      if (!existingArticle) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      if (existingArticle.authorId !== req.user!.id) {
        return res.status(403).json({
          errors: { body: ['Not authorized to update this article'] }
        });
      }

      const updateData: any = {};

      if (article.title) {
        updateData.title = article.title;
        updateData.slug = await generateUniqueSlug(article.title, prisma);
      }
      if (article.description) updateData.description = article.description;
      if (article.body) updateData.body = article.body;

      const updatedArticle = await prisma.article.update({
        where: { slug },
        data: updateData
      });

      const articleResponse = await buildArticleResponse(
        updatedArticle,
        req.user!.id
      );

      return res.status(200).json({ article: articleResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// DELETE /api/articles/:slug - Delete article
router.delete(
  '/articles/:slug',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      if (article.authorId !== req.user!.id) {
        return res.status(403).json({
          errors: { body: ['Not authorized to delete this article'] }
        });
      }

      await prisma.article.delete({
        where: { slug }
      });

      return res.status(200).json({});
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// POST /api/articles/:slug/favorite - Favorite article
router.post(
  '/articles/:slug/favorite',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      await prisma.favorite.upsert({
        where: {
          userId_articleId: {
            userId: req.user!.id,
            articleId: article.id
          }
        },
        update: {},
        create: {
          userId: req.user!.id,
          articleId: article.id
        }
      });

      const articleResponse = await buildArticleResponse(
        article,
        req.user!.id
      );

      return res.status(200).json({ article: articleResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// DELETE /api/articles/:slug/favorite - Unfavorite article
router.delete(
  '/articles/:slug/favorite',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      await prisma.favorite.deleteMany({
        where: {
          userId: req.user!.id,
          articleId: article.id
        }
      });

      const articleResponse = await buildArticleResponse(
        article,
        req.user!.id
      );

      return res.status(200).json({ article: articleResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

export default router;

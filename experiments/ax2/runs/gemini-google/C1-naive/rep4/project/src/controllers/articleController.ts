import { Response } from 'express';
import slugify from 'slugify';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

function generateSlug(title: string): string {
  const baseSlug = slugify(title, { lower: true, strict: true }) || 'article';
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

async function formatArticle(article: any, currentUserId?: number) {
  let favorited = false;
  let following = false;

  if (currentUserId) {
    const fav = await prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId: currentUserId,
          articleId: article.id
        }
      }
    });
    favorited = !!fav;

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: article.author.id
        }
      }
    });
    following = !!follow;
  }

  const favoritesCount = await prisma.favorite.count({
    where: { articleId: article.id }
  });

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags ? article.tags.map((t: any) => t.name) : [],
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited,
    favoritesCount,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following
    }
  };
}

export async function listArticles(req: AuthRequest, res: Response) {
  try {
    const { tag, author, favorited, limit = '20', offset = '0' } = req.query;

    const take = parseInt(limit as string, 10) || 20;
    const skip = parseInt(offset as string, 10) || 0;

    const where: any = {};

    if (tag) {
      where.tags = {
        some: { name: tag as string }
      };
    }

    if (author) {
      where.author = {
        username: author as string
      };
    }

    if (favorited) {
      where.favorites = {
        some: {
          user: {
            username: favorited as string
          }
        }
      };
    }

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true
        }
      }),
      prisma.article.count({ where })
    ]);

    const formattedArticles = await Promise.all(
      articles.map((article) => formatArticle(article, req.user?.id))
    );

    return res.status(200).json({
      articles: formattedArticles,
      articlesCount
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function feedArticles(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  try {
    const { limit = '20', offset = '0' } = req.query;
    const take = parseInt(limit as string, 10) || 20;
    const skip = parseInt(offset as string, 10) || 0;

    const follows = await prisma.follows.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true }
    });

    const followingIds = follows.map((f) => f.followingId);

    const where = {
      authorId: { in: followingIds }
    };

    const [articles, articlesCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: true
        }
      }),
      prisma.article.count({ where })
    ]);

    const formattedArticles = await Promise.all(
      articles.map((article) => formatArticle(article, req.user?.id))
    );

    return res.status(200).json({
      articles: formattedArticles,
      articlesCount
    });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function getArticle(req: AuthRequest, res: Response) {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true
      }
    });

    if (!article) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    const formatted = await formatArticle(article, req.user?.id);
    return res.status(200).json({ article: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function createArticle(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { article } = req.body || {};
  if (!article) {
    return res.status(422).json({ errors: { body: ["can't be empty"] } });
  }

  const { title, description, body, tagList = [] } = article;
  const errors: Record<string, string[]> = {};

  if (!title) errors.title = ["can't be blank"];
  if (!description) errors.description = ["can't be blank"];
  if (!body) errors.body = ["can't be blank"];

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  try {
    const slug = generateSlug(title);

    const tagConnectOrCreate = (tagList as string[]).map((tagName) => ({
      where: { name: tagName },
      create: { name: tagName }
    }));

    const created = await prisma.article.create({
      data: {
        slug,
        title,
        description,
        body,
        authorId: req.user.id,
        tags: {
          connectOrCreate: tagConnectOrCreate
        }
      },
      include: {
        author: true,
        tags: true
      }
    });

    const formatted = await formatArticle(created, req.user.id);
    return res.status(201).json({ article: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function updateArticle(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug } = req.params;
  const { article } = req.body || {};
  if (!article) {
    return res.status(422).json({ errors: { body: ["can't be empty"] } });
  }

  try {
    const existing = await prisma.article.findUnique({
      where: { slug },
      include: { author: true }
    });

    if (!existing) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ errors: { body: ['Forbidden'] } });
    }

    const data: any = {};
    if (article.title) {
      data.title = article.title;
      data.slug = generateSlug(article.title);
    }
    if (article.description !== undefined) {
      data.description = article.description;
    }
    if (article.body !== undefined) {
      data.body = article.body;
    }

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data,
      include: {
        author: true,
        tags: true
      }
    });

    const formatted = await formatArticle(updated, req.user.id);
    return res.status(200).json({ article: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function deleteArticle(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug } = req.params;

  try {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existing) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ errors: { body: ['Forbidden'] } });
    }

    await prisma.article.delete({
      where: { id: existing.id }
    });

    return res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function favoriteArticle(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug } = req.params;

  try {
    const existing = await prisma.article.findUnique({
      where: { slug },
      include: { author: true, tags: true }
    });

    if (!existing) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    await prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId: existing.id
        }
      },
      create: {
        userId: req.user.id,
        articleId: existing.id
      },
      update: {}
    });

    const formatted = await formatArticle(existing, req.user.id);
    return res.status(200).json({ article: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function unfavoriteArticle(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug } = req.params;

  try {
    const existing = await prisma.article.findUnique({
      where: { slug },
      include: { author: true, tags: true }
    });

    if (!existing) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        articleId: existing.id
      }
    });

    const formatted = await formatArticle(existing, req.user.id);
    return res.status(200).json({ article: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

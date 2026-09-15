import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { slugify } from '../utils/slugify';

function formatArticle(article: any, currentUserId?: number) {
  const isFavorited = currentUserId
    ? article.favoritedBy?.some((f: any) => f.userId === currentUserId) ?? false
    : false;

  const isFollowing = currentUserId
    ? article.author?.followedBy?.some((f: any) => f.followerId === currentUserId) ?? false
    : false;

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags?.map((t: any) => t.name) || [],
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: isFavorited,
    favoritesCount: article._count?.favoritedBy ?? (article.favoritedBy?.length || 0),
    author: {
      username: article.author.username,
      bio: article.author.bio || '',
      image: article.author.image || '',
      following: isFollowing
    }
  };
}

export async function listArticles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { tag, author, favorited, limit = '20', offset = '0' } = req.query;
    const take = parseInt(limit as string, 10) || 20;
    const skip = parseInt(offset as string, 10) || 0;

    const where: any = {};

    if (tag) {
      where.tags = {
        some: {
          name: tag as string
        }
      };
    }

    if (author) {
      where.author = {
        username: author as string
      };
    }

    if (favorited) {
      where.favoritedBy = {
        some: {
          user: {
            username: favorited as string
          }
        }
      };
    }

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              followedBy: true
            }
          },
          tags: true,
          favoritedBy: true,
          _count: {
            select: { favoritedBy: true }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    const formattedArticles = articles.map(a => formatArticle(a, req.user?.id));

    res.status(200).json({
      articles: formattedArticles,
      articlesCount: totalCount
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function feedArticles(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { limit = '20', offset = '0' } = req.query;
    const take = parseInt(limit as string, 10) || 20;
    const skip = parseInt(offset as string, 10) || 0;

    const follows = await prisma.follows.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true }
    });

    const followingIds = follows.map(f => f.followingId);

    const where = {
      authorId: { in: followingIds }
    };

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              followedBy: true
            }
          },
          tags: true,
          favoritedBy: true,
          _count: {
            select: { favoritedBy: true }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    const formattedArticles = articles.map(a => formatArticle(a, req.user?.id));

    res.status(200).json({
      articles: formattedArticles,
      articlesCount: totalCount
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function getArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          include: {
            followedBy: true
          }
        },
        tags: true,
        favoritedBy: true,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    res.status(200).json({
      article: formatArticle(article, req.user?.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function createArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { article } = req.body || {};
    if (!article) {
      res.status(422).json({ errors: { body: ["can't be empty"] } });
      return;
    }

    const { title, description, body, tagList = [] } = article;
    const errors: Record<string, string[]> = {};

    if (!title) errors.title = ["can't be blank"];
    if (!description) errors.description = ["can't be blank"];
    if (!body) errors.body = ["can't be blank"];

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ errors });
      return;
    }

    const slug = slugify(title);

    const rawTags: string[] = Array.isArray(tagList) ? tagList : [];
    const uniqueTags = Array.from(new Set(rawTags.map((t: string) => t.trim()).filter(Boolean)));

    const tagConnectOrCreate = uniqueTags.map((tag: string) => ({
      where: { name: tag },
      create: { name: tag }
    }));

    const newArticle = await prisma.article.create({
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
        author: {
          include: {
            followedBy: true
          }
        },
        tags: true,
        favoritedBy: true,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    res.status(201).json({
      article: formatArticle(newArticle, req.user.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function updateArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug } = req.params;
    const { article: updateData } = req.body || {};
    if (!updateData) {
      res.status(422).json({ errors: { body: ["can't be empty"] } });
      return;
    }

    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existingArticle) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    if (existingArticle.authorId !== req.user.id) {
      res.status(403).json({ errors: { authorization: ['You are not the author of this article'] } });
      return;
    }

    const dataToUpdate: any = {};
    if (updateData.title) {
      dataToUpdate.title = updateData.title;
      dataToUpdate.slug = slugify(updateData.title);
    }
    if (typeof updateData.description !== 'undefined') {
      dataToUpdate.description = updateData.description;
    }
    if (typeof updateData.body !== 'undefined') {
      dataToUpdate.body = updateData.body;
    }
    if (updateData.tagList && Array.isArray(updateData.tagList)) {
      const uniqueTags = Array.from(new Set((updateData.tagList as string[]).map((t: string) => t.trim()).filter(Boolean)));
      dataToUpdate.tags = {
        set: [],
        connectOrCreate: uniqueTags.map((tag: string) => ({
          where: { name: tag },
          create: { name: tag }
        }))
      };
    }

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: dataToUpdate,
      include: {
        author: {
          include: {
            followedBy: true
          }
        },
        tags: true,
        favoritedBy: true,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    res.status(200).json({
      article: formatArticle(updatedArticle, req.user.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function deleteArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug } = req.params;

    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    });

    if (!existingArticle) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    if (existingArticle.authorId !== req.user.id) {
      res.status(403).json({ errors: { authorization: ['You are not the author of this article'] } });
      return;
    }

    await prisma.article.delete({
      where: { slug }
    });

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function favoriteArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    await prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId: article.id
        }
      },
      create: {
        userId: req.user.id,
        articleId: article.id
      },
      update: {}
    });

    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: {
          include: {
            followedBy: true
          }
        },
        tags: true,
        favoritedBy: true,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    res.status(200).json({
      article: formatArticle(updatedArticle, req.user.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function unfavoriteArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        articleId: article.id
      }
    });

    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: {
          include: {
            followedBy: true
          }
        },
        tags: true,
        favoritedBy: true,
        _count: {
          select: { favoritedBy: true }
        }
      }
    });

    res.status(200).json({
      article: formatArticle(updatedArticle, req.user.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

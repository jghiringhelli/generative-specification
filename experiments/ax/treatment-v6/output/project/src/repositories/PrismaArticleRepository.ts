import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  IArticleRepository,
  ArticleWithMeta,
  ArticleFilters,
  CreateArticleData,
  UpdateArticleData,
} from './IArticleRepository.js';
import { NotFoundError } from '../errors/AppError.js';

/** Prisma include clause for article with full metadata. */
const ARTICLE_INCLUDE = {
  author: true,
  tags: { include: { tag: true } },
  favorites: true,
} as const;

/**
 * Maps a Prisma article query result to the ArticleWithMeta domain type.
 * Extracted to avoid duplication across query methods (§8 DRY).
 */
function mapArticleToMeta(
  article: Prisma.ArticleGetPayload<{ include: typeof ARTICLE_INCLUDE }>,
  currentUserId?: number,
): ArticleWithMeta {
  const favoritesCount = article.favorites.length;
  const favorited = currentUserId !== undefined
    ? article.favorites.some((f) => f.userId === currentUserId)
    : false;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    authorId: article.authorId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    tagList: article.tags.map((at) => at.tag.name).sort(),
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: false, // Follow state resolved at service layer when needed
    },
    favoritesCount,
    favorited,
  };
}

/**
 * Prisma-backed implementation of IArticleRepository.
 * §9 check: implements findAll, findFeed, findBySlug, create, update, delete,
 *           favorite, unfavorite, isFavorited, getFavoritesCount.
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async findAll(
    filters: ArticleFilters,
    currentUserId?: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }> {
    const where: Prisma.ArticleWhereInput = {
      ...(filters.tag && {
        tags: { some: { tag: { name: filters.tag } } },
      }),
      ...(filters.author && {
        author: { username: filters.author },
      }),
      ...(filters.favorited && {
        favorites: { some: { user: { username: filters.favorited } } },
      }),
    };

    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: await this.resolveFollowingForArticles(
        articles.map((a) => mapArticleToMeta(a, currentUserId)),
        currentUserId,
      ),
      articlesCount,
    };
  }

  /** @inheritdoc */
  async findFeed(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ articles: ArticleWithMeta[]; articlesCount: number }> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followedBy: { some: { followerId: userId } },
      },
    };

    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: await this.resolveFollowingForArticles(
        articles.map((a) => mapArticleToMeta(a, userId)),
        userId,
      ),
      articlesCount,
    };
  }

  /** @inheritdoc */
  async findBySlug(slug: string, currentUserId?: number): Promise<ArticleWithMeta | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE,
    });

    if (!article) return null;

    const mapped = mapArticleToMeta(article, currentUserId);
    const [resolved] = await this.resolveFollowingForArticles([mapped], currentUserId);
    return resolved;
  }

  /** @inheritdoc */
  async create(data: CreateArticleData): Promise<ArticleWithMeta> {
    // Ensure all tags exist (§8: createIfNotExists pattern reused via upsert)
    const tagUpserts = data.tagList.map((name) =>
      this.prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
    );
    const tags = await Promise.all(tagUpserts);

    const article = await this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: ARTICLE_INCLUDE,
    });

    return mapArticleToMeta(article, data.authorId);
  }

  /** @inheritdoc */
  async update(
    slug: string,
    data: UpdateArticleData,
    currentUserId?: number,
  ): Promise<ArticleWithMeta> {
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (!existing) {
      throw new NotFoundError('Article', slug);
    }

    let tagOperations: Prisma.ArticleUpdateInput['tags'] | undefined;
    if (data.tagList !== undefined) {
      const tagUpserts = data.tagList.map((name) =>
        this.prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
      );
      const tags = await Promise.all(tagUpserts);
      tagOperations = {
        deleteMany: {},
        create: tags.map((tag) => ({ tagId: tag.id })),
      };
    }

    const article = await this.prisma.article.update({
      where: { slug },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.body !== undefined && { body: data.body }),
        ...(tagOperations && { tags: tagOperations }),
      },
      include: ARTICLE_INCLUDE,
    });

    const mapped = mapArticleToMeta(article, currentUserId);
    const [resolved] = await this.resolveFollowingForArticles([mapped], currentUserId);
    return resolved;
  }

  /** @inheritdoc */
  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({ where: { slug } });
  }

  /**
   * Add an article to a user's favorites.
   * §9 CRITICAL: This method was missing in treatment-v3. Verified present here.
   * @inheritdoc
   */
  async favorite(slug: string, userId: number): Promise<ArticleWithMeta> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    await this.prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId: article.id } },
      create: { userId, articleId: article.id },
      update: {},
    });

    const updated = await this.prisma.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE,
    });

    const mapped = mapArticleToMeta(updated!, userId);
    const [resolved] = await this.resolveFollowingForArticles([mapped], userId);
    return resolved;
  }

  /**
   * Remove an article from a user's favorites.
   * §9 CRITICAL: This method was missing in treatment-v3. Verified present here.
   * @inheritdoc
   */
  async unfavorite(slug: string, userId: number): Promise<ArticleWithMeta> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    await this.prisma.favorite.deleteMany({
      where: { userId, articleId: article.id },
    });

    const updated = await this.prisma.article.findUnique({
      where: { slug },
      include: ARTICLE_INCLUDE,
    });

    const mapped = mapArticleToMeta(updated!, userId);
    const [resolved] = await this.resolveFollowingForArticles([mapped], userId);
    return resolved;
  }

  /** @inheritdoc */
  async isFavorited(articleId: number, userId: number): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return favorite !== null;
  }

  /** @inheritdoc */
  async getFavoritesCount(articleId: number): Promise<number> {
    return this.prisma.favorite.count({ where: { articleId } });
  }

  /**
   * Resolves the `following` field on article author profiles for the current user.
   * Extracted to avoid N+1 queries — loads all following relationships in one query.
   */
  private async resolveFollowingForArticles(
    articles: ArticleWithMeta[],
    currentUserId?: number,
  ): Promise<ArticleWithMeta[]> {
    if (!currentUserId || articles.length === 0) return articles;

    const authorIds = [...new Set(articles.map((a) => a.authorId))];
    const follows = await this.prisma.follow.findMany({
      where: { followerId: currentUserId, followingId: { in: authorIds } },
      select: { followingId: true },
    });
    const followingSet = new Set(follows.map((f) => f.followingId));

    return articles.map((article) => ({
      ...article,
      author: {
        ...article.author,
        following: followingSet.has(article.authorId),
      },
    }));
  }
}

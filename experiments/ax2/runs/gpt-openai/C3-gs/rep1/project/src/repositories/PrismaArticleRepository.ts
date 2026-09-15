import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  ArticleFilters,
  ArticleListResult,
  ArticleRecord,
  CreateArticleRecord,
  IArticleRepository,
  UpdateArticleRecord,
} from './IArticleRepository';

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { author: { include: { followers: true } }; tags: { include: { tag: true } }; favorites: true };
}>;

export class PrismaArticleRepository implements IArticleRepository {
  public constructor(private readonly client: PrismaClient) {}

  /** Finds one article by slug. */
  public async findBySlug(slug: string, viewerId?: string): Promise<ArticleRecord | null> {
    const article = await this.client.article.findUnique({ where: { slug }, include: this.include });
    return article ? this.map(article, viewerId) : null;
  }

  /** Lists articles matching filters and pagination. */
  public async list(filters: ArticleFilters): Promise<ArticleListResult> {
    const where = this.where(filters);
    const [articles, count] = await this.client.$transaction([
      this.client.article.findMany({
        where,
        include: this.include,
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.client.article.count({ where }),
    ]);
    return { articles: articles.map((article) => this.map(article, filters.viewerId)), count };
  }

  /** Lists articles authored by users followed by the authenticated user. */
  public async feed(userId: string, limit: number, offset: number): Promise<ArticleListResult> {
    const where = { author: { followers: { some: { followerId: userId } } } };
    const [articles, count] = await this.client.$transaction([
      this.client.article.findMany({ where, include: this.include, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      this.client.article.count({ where }),
    ]);
    return { articles: articles.map((article) => this.map(article, userId)), count };
  }

  /** Creates an article and connects its tags. */
  public async create(data: CreateArticleRecord): Promise<ArticleRecord> {
    const article = await this.client.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: { create: data.tagList.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } })) },
      },
      include: this.include,
    });
    return this.map(article, data.authorId);
  }

  /** Updates an article's mutable scalar fields. */
  public async update(id: string, data: UpdateArticleRecord, viewerId?: string): Promise<ArticleRecord> {
    const article = await this.client.article.update({ where: { id }, data, include: this.include });
    return this.map(article, viewerId);
  }

  /** Deletes an article. */
  public async delete(id: string): Promise<void> {
    await this.client.article.delete({ where: { id } });
  }

  /** Favorites an article idempotently. */
  public async favorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  /** Removes an article favorite idempotently. */
  public async unfavorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.deleteMany({ where: { userId, articleId } });
  }

  private readonly include = {
    author: { include: { followers: true } },
    tags: { include: { tag: true } },
    favorites: true,
  } as const;

  private where(filters: ArticleFilters): Prisma.ArticleWhereInput {
    return {
      tags: filters.tag ? { some: { tag: { name: filters.tag } } } : undefined,
      author: filters.author ? { username: filters.author } : undefined,
      favorites: filters.favoritedBy ? { some: { user: { username: filters.favoritedBy } } } : undefined,
    };
  }

  private map(article: ArticleWithRelations, viewerId?: string): ArticleRecord {
    return {
      ...article,
      tagList: article.tags.map(({ tag }) => tag.name),
      favorited: viewerId ? article.favorites.some(({ userId }) => userId === viewerId) : false,
      favoritesCount: article.favorites.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: viewerId
          ? article.author.followers.some(({ followerId }) => followerId === viewerId)
          : false,
      },
    };
  }
}

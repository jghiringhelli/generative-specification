import { PrismaClient } from '@prisma/client';
import { IArticleRepository, CreateArticleData, UpdateArticleData, ArticleFilters } from '../../domain/repositories/IArticleRepository';
import { Article } from '../../domain/entities/Article';

/*
 * ===========================================================================
 *  PrismaArticleRepository
 *  Data-access for the Article aggregate (articles, tags, favorites).
 * ===========================================================================
 */
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private prisma: PrismaClient) {}

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  async create(data: CreateArticleData): Promise<Article> {
    return await this.prisma.article.create({ data });
  }

  async findBySlug(slug: string): Promise<Article | null> {
    return await this.prisma.article.findUnique({ where: { slug } });
  }

  async findMany(filters: ArticleFilters, limit: number, offset: number): Promise<Article[]> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async count(filters: ArticleFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.article.count({ where });
  }

  async findFeed(followingIds: number[], limit: number, offset: number): Promise<Article[]> {
    return await this.prisma.article.findMany({
      where: { authorId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async countFeed(followingIds: number[]): Promise<number> {
    return await this.prisma.article.count({
      where: { authorId: { in: followingIds } }
    });
  }

  async update(slug: string, data: UpdateArticleData): Promise<Article> {
    return await this.prisma.article.update({ where: { slug }, data });
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.delete({ where: { slug } });
  }

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------

  async addTag(articleId: number, tagName: string): Promise<void> {
    let tag = await this.prisma.tag.findUnique({ where: { name: tagName } });

    if (!tag) {
      tag = await this.prisma.tag.create({ data: { name: tagName } });
    }

    await this.prisma.articleTag.create({
      data: { articleId, tagId: tag.id }
    });
  }

  // Old batch upsert, replaced by the per-tag addTag loop above when the
  // create/update paths were simplified. Kept in case the importer needs it.
  // async addTagsBatch(articleId: number, tagNames: string[]): Promise<void> {
  //   const tags = await this.prisma.$transaction(
  //     tagNames.map((name) =>
  //       this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
  //     )
  //   );
  //   await this.prisma.articleTag.createMany({
  //     data: tags.map((t) => ({ articleId, tagId: t.id })),
  //     skipDuplicates: true
  //   });
  // }

  async removeTags(articleId: number): Promise<void> {
    await this.prisma.articleTag.deleteMany({ where: { articleId } });
  }

  async getTags(articleId: number): Promise<string[]> {
    const articleTags = await this.prisma.articleTag.findMany({
      where: { articleId },
      include: { tag: true }
    });
    return articleTags.map(at => at.tag.name);
  }

  // -------------------------------------------------------------------------
  // Favorites
  // -------------------------------------------------------------------------

  async isFavorited(articleId: number, userId: number): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: { userId, articleId }
      }
    });
    return !!favorite;
  }

  async getFavoritesCount(articleId: number): Promise<number> {
    return await this.prisma.favorite.count({ where: { articleId } });
  }

  async favorite(articleId: number, userId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: { userId, articleId }
      },
      update: {},
      create: { userId, articleId }
    });
  }

  async unfavorite(articleId: number, userId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: { userId, articleId }
    });
  }

  private buildWhereClause(filters: ArticleFilters): any {
    const where: any = {};

    if (filters.tag) {
      where.tags = {
        some: {
          tag: { name: filters.tag }
        }
      };
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.favoritedByUserId) {
      where.favorites = {
        some: { userId: filters.favoritedByUserId }
      };
    }

    return where;
  }
}

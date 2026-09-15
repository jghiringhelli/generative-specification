import { Prisma, type Article } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { ArticleInput, ArticleUpdateInput, ListArticlesInput } from './schemas';

const articleRelations = {
  author: { include: { followers: true } },
  tags: { include: { tag: true } },
  favorites: true,
} satisfies Prisma.ArticleInclude;

export type ArticleRecord = Prisma.ArticleGetPayload<{ include: typeof articleRelations }>;

export class ArticleRepository {
  /** Lists articles matching filters and returns the unpaginated count. */
  public async list(input: ListArticlesInput): Promise<{ records: ArticleRecord[]; count: number }> {
    const where: Prisma.ArticleWhereInput = {
      ...(input.tag && { tags: { some: { tag: { name: input.tag } } } }),
      ...(input.author && { author: { username: input.author } }),
      ...(input.favorited && { favorites: { some: { user: { username: input.favorited } } } }),
    };
    const [records, count] = await prisma.$transaction([
      prisma.article.findMany({ where, include: articleRelations, orderBy: { createdAt: 'desc' }, skip: input.offset, take: input.limit }),
      prisma.article.count({ where }),
    ]);
    return { records, count };
  }

  /** Lists articles authored by users followed by the viewer. */
  public async feed(viewerId: number, input: ListArticlesInput): Promise<{ records: ArticleRecord[]; count: number }> {
    const where: Prisma.ArticleWhereInput = { author: { followers: { some: { followerId: viewerId } } } };
    const [records, count] = await prisma.$transaction([
      prisma.article.findMany({ where, include: articleRelations, orderBy: { createdAt: 'desc' }, skip: input.offset, take: input.limit }),
      prisma.article.count({ where }),
    ]);
    return { records, count };
  }

  /** Finds an article by slug. */
  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return prisma.article.findUnique({ where: { slug }, include: articleRelations });
  }

  /** Creates an article and connects its tags. */
  public create(authorId: number, slug: string, input: ArticleInput): Promise<ArticleRecord> {
    return prisma.article.create({ data: {
      slug, title: input.title, description: input.description, body: input.body, authorId,
      tags: { create: input.tagList.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } })) },
    }, include: articleRelations });
  }

  /** Updates an article and replaces tags when a tag list is supplied. */
  public update(id: number, input: ArticleUpdateInput & { slug?: string }): Promise<ArticleRecord> {
    const { tagList, ...articleData } = input;
    const tags = tagList ? {
      deleteMany: {},
      create: tagList.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } })),
    } : undefined;
    return prisma.article.update({ where: { id }, data: { ...articleData, tags }, include: articleRelations });
  }

  /** Deletes an article. */
  public async delete(id: number): Promise<void> {
    await prisma.article.delete({ where: { id } });
  }

  /** Adds a favorite idempotently. */
  public async favorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.upsert({ where: { userId_articleId: { userId, articleId } }, create: { userId, articleId }, update: {} });
  }

  /** Removes a favorite idempotently. */
  public async unfavorite(userId: number, articleId: number): Promise<void> {
    await prisma.favorite.deleteMany({ where: { userId, articleId } });
  }
}



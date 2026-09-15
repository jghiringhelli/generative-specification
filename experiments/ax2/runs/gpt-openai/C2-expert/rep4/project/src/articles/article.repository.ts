import { Prisma, PrismaClient } from "@prisma/client";
import { ArticleListQuery, CreateArticleInput, UpdateArticleInput } from "./article.schemas";

const articleRelations = {
  author: { include: { followers: true } },
  tags: true,
  favorites: true
} satisfies Prisma.ArticleInclude;

export type ArticleRecord = Prisma.ArticleGetPayload<{ include: typeof articleRelations }>;

export interface IArticleRepository {
  list(query: ArticleListQuery, followedBy?: number): Promise<[ArticleRecord[], number]>;
  findBySlug(slug: string): Promise<ArticleRecord | null>;
  create(authorId: number, slug: string, input: CreateArticleInput): Promise<ArticleRecord>;
  update(id: number, slug: string | undefined, input: UpdateArticleInput): Promise<ArticleRecord>;
  delete(id: number): Promise<void>;
  favorite(userId: number, articleId: number): Promise<void>;
  unfavorite(userId: number, articleId: number): Promise<void>;
}

export class ArticleRepository implements IArticleRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async list(query: ArticleListQuery, followedBy?: number): Promise<[ArticleRecord[], number]> {
    const where = this.buildWhere(query, followedBy);
    return this.database.$transaction([
      this.database.article.findMany({
        where,
        include: articleRelations,
        orderBy: { createdAt: "desc" },
        take: query.limit,
        skip: query.offset
      }),
      this.database.article.count({ where })
    ]);
  }

  public findBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.database.article.findUnique({ where: { slug }, include: articleRelations });
  }

  public create(authorId: number, slug: string, input: CreateArticleInput): Promise<ArticleRecord> {
    const tagNames = [...new Set(input.tagList)];
    return this.database.article.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        body: input.body,
        authorId,
        tags: { connectOrCreate: tagNames.map((name) => ({ where: { name }, create: { name } })) }
      },
      include: articleRelations
    });
  }

  public update(id: number, slug: string | undefined, input: UpdateArticleInput): Promise<ArticleRecord> {
    const { tagList, ...fields } = input;
    const tagNames = tagList ? [...new Set(tagList)] : undefined;
    return this.database.article.update({
      where: { id },
      data: {
        ...fields,
        slug,
        ...(tagNames && {
          tags: {
            set: [],
            connectOrCreate: tagNames.map((name) => ({ where: { name }, create: { name } }))
          }
        })
      },
      include: articleRelations
    });
  }

  public async delete(id: number): Promise<void> {
    await this.database.article.delete({ where: { id } });
  }

  public async favorite(userId: number, articleId: number): Promise<void> {
    await this.database.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {}
    });
  }

  public async unfavorite(userId: number, articleId: number): Promise<void> {
    await this.database.favorite.deleteMany({ where: { userId, articleId } });
  }

  private buildWhere(query: ArticleListQuery, followedBy?: number): Prisma.ArticleWhereInput {
    return {
      ...(query.tag && { tags: { some: { name: query.tag } } }),
      ...(query.favorited && { favorites: { some: { user: { username: query.favorited } } } }),
      ...((query.author || followedBy) && {
        author: {
          ...(query.author && { username: query.author }),
          ...(followedBy && { followers: { some: { followerId: followedBy } } })
        }
      })
    };
  }
}

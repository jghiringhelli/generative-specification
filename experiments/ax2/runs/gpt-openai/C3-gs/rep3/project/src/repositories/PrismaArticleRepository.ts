import { Prisma, PrismaClient } from '@prisma/client';
import {
  ArticleQuery,
  ArticleRecord,
  CreateArticleRecord,
  IArticleRepository,
  UpdateArticleRecord,
} from './IArticleRepository';

const articleInclude = {
  author: {
    include: { followers: { select: { followerId: true } } },
  },
  tags: { select: { tagName: true } },
  favorites: { select: { userId: true } },
} satisfies Prisma.ArticleInclude;

type LoadedArticle = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

function toRecord(article: LoadedArticle): ArticleRecord {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    authorId: article.authorId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    tagList: article.tags.map((tag) => tag.tagName),
    author: {
      id: article.author.id,
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      followerIds: article.author.followers.map((follow) => follow.followerId),
    },
    favoritedByIds: article.favorites.map((favorite) => favorite.userId),
  };
}

function whereFor(query: ArticleQuery): Prisma.ArticleWhereInput {
  return {
    ...(query.tag ? { tags: { some: { tagName: query.tag } } } : {}),
    ...(query.author ? { author: { username: query.author } } : {}),
    ...(query.favoritedBy
      ? { favorites: { some: { user: { username: query.favoritedBy } } } }
      : {}),
  };
}

export class PrismaArticleRepository implements IArticleRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async findBySlug(slug: string): Promise<ArticleRecord | null> {
    const article = await this.client.article.findUnique({
      where: { slug },
      include: articleInclude,
    });
    return article ? toRecord(article) : null;
  }

  public async list(query: ArticleQuery): Promise<ReadonlyArray<ArticleRecord>> {
    const articles = await this.client.article.findMany({
      where: whereFor(query),
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    });
    return articles.map(toRecord);
  }

  public count(query: ArticleQuery): Promise<number> {
    return this.client.article.count({ where: whereFor(query) });
  }

  public async feed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ReadonlyArray<ArticleRecord>> {
    const articles = await this.client.article.findMany({
      where: { author: { followers: { some: { followerId: userId } } } },
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return articles.map(toRecord);
  }

  public countFeed(userId: string): Promise<number> {
    return this.client.article.count({
      where: { author: { followers: { some: { followerId: userId } } } },
    });
  }

  public async create(data: CreateArticleRecord): Promise<ArticleRecord> {
    const article = await this.client.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,
        tags: {
          create: data.tagList.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: articleInclude,
    });
    return toRecord(article);
  }

  public async update(
    id: string,
    data: UpdateArticleRecord,
  ): Promise<ArticleRecord> {
    const article = await this.client.article.update({
      where: { id },
      data,
      include: articleInclude,
    });
    return toRecord(article);
  }

  public async delete(id: string): Promise<void> {
    await this.client.article.delete({ where: { id } });
  }

  public async favorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
  }

  public async unfavorite(articleId: string, userId: string): Promise<void> {
    await this.client.favorite.deleteMany({ where: { userId, articleId } });
  }
}

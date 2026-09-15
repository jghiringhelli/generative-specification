import { Prisma } from "@prisma/client";
import slugify from "slugify";
import { prisma } from "../database";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors";

const DEFAULT_LIMIT = 20;
const MAXIMUM_LIMIT = 100;

const articleInclude = {
  author: true,
  tags: true,
  favorites: { select: { userId: true } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

interface ArticleInput {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: string;
  offset?: string;
}

function validateNewArticle(input: ArticleInput): asserts input is Required<Pick<ArticleInput, "title" | "description" | "body">> & ArticleInput {
  const errors: Record<string, string[]> = {};
  if (!input.title?.trim()) errors.title = ["can't be blank"];
  if (!input.description?.trim()) errors.description = ["can't be blank"];
  if (!input.body?.trim()) errors.body = ["can't be blank"];
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

function createSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true }) || "article";
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function followingAuthor(viewerId: number | undefined, authorId: number): Promise<boolean> {
  if (!viewerId) return false;
  return Boolean(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: authorId } },
  }));
}

async function toArticleResponse(
  article: ArticleWithRelations,
  viewerId?: number,
): Promise<ArticleResponse> {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((tag) => tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: viewerId ? article.favorites.some((favorite) => favorite.userId === viewerId) : false,
    favoritesCount: article.favorites.length,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: await followingAuthor(viewerId, article.authorId),
    },
  };
}

async function findArticle(slug: string): Promise<ArticleWithRelations> {
  const article = await prisma.article.findUnique({ where: { slug }, include: articleInclude });
  if (!article) throw new NotFoundError("Article not found");
  return article;
}

function parsePageValue(value: string | undefined, fallback: number, maximum?: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
}

/** Lists articles matching the supplied filters. */
export async function listArticles(filters: ArticleFilters, viewerId?: number) {
  const where: Prisma.ArticleWhereInput = {
    ...(filters.tag && { tags: { some: { name: filters.tag } } }),
    ...(filters.author && { author: { username: filters.author } }),
    ...(filters.favorited && { favorites: { some: { user: { username: filters.favorited } } } }),
  };
  const [articles, articlesCount] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: "desc" },
      take: parsePageValue(filters.limit, DEFAULT_LIMIT, MAXIMUM_LIMIT),
      skip: parsePageValue(filters.offset, 0),
    }),
    prisma.article.count({ where }),
  ]);
  return {
    articles: await Promise.all(articles.map((article) => toArticleResponse(article, viewerId))),
    articlesCount,
  };
}

/** Lists articles authored by users followed by the current user. */
export async function getArticleFeed(filters: ArticleFilters, userId: number) {
  const where = { author: { followers: { some: { followerId: userId } } } };
  const [articles, articlesCount] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { createdAt: "desc" },
      take: parsePageValue(filters.limit, DEFAULT_LIMIT, MAXIMUM_LIMIT),
      skip: parsePageValue(filters.offset, 0),
    }),
    prisma.article.count({ where }),
  ]);
  return {
    articles: await Promise.all(articles.map((article) => toArticleResponse(article, userId))),
    articlesCount,
  };
}

/** Returns one article by slug. */
export async function getArticle(slug: string, viewerId?: number): Promise<ArticleResponse> {
  return toArticleResponse(await findArticle(slug), viewerId);
}

/** Creates an article for the current user. */
export async function createArticle(input: ArticleInput, authorId: number): Promise<ArticleResponse> {
  validateNewArticle(input);
  const tags = [...new Set(input.tagList ?? [])].filter(Boolean);
  const article = await prisma.article.create({
    data: {
      slug: createSlug(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      authorId,
      tags: { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
    },
    include: articleInclude,
  });
  return toArticleResponse(article, authorId);
}

/** Updates an article owned by the current user. */
export async function updateArticle(
  slug: string,
  input: ArticleInput,
  userId: number,
): Promise<ArticleResponse> {
  if (input.title !== undefined && !input.title.trim()) {
    throw new ValidationError({ title: ["can't be blank"] });
  }
  if (input.description !== undefined && !input.description.trim()) {
    throw new ValidationError({ description: ["can't be blank"] });
  }
  if (input.body !== undefined && !input.body.trim()) {
    throw new ValidationError({ body: ["can't be blank"] });
  }
  const existing = await findArticle(slug);
  if (existing.authorId !== userId) throw new UnauthorizedError("Only the author may update this article");
  const tags = input.tagList ? [...new Set(input.tagList)].filter(Boolean) : undefined;
  const article = await prisma.article.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title, slug: createSlug(input.title) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.body !== undefined && { body: input.body }),
      ...(tags !== undefined && {
        tags: { set: [], connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
      }),
    },
    include: articleInclude,
  });
  return toArticleResponse(article, userId);
}

/** Deletes an article owned by the current user. */
export async function deleteArticle(slug: string, userId: number): Promise<void> {
  const article = await findArticle(slug);
  if (article.authorId !== userId) throw new UnauthorizedError("Only the author may delete this article");
  await prisma.article.delete({ where: { id: article.id } });
}

/** Favorites an article for the current user. */
export async function favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
  const article = await findArticle(slug);
  await prisma.favorite.upsert({
    where: { userId_articleId: { userId, articleId: article.id } },
    create: { userId, articleId: article.id },
    update: {},
  });
  return getArticle(slug, userId);
}

/** Removes an article from the current user's favorites. */
export async function unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
  const article = await findArticle(slug);
  await prisma.favorite.deleteMany({ where: { userId, articleId: article.id } });
  return getArticle(slug, userId);
}

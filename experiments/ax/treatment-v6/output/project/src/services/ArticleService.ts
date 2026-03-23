import { z } from 'zod';
import type { IArticleRepository, ArticleWithMeta } from '../repositories/IArticleRepository.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/AppError.js';

/** Default pagination constants per spec. */
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

/**
 * Parses and clamps limit/offset from a query object.
 * @param query - Raw query params from the request
 * @returns Validated pagination values
 */
function parsePagination(query: Record<string, unknown>): { limit: number; offset: number } {
  return {
    limit: Math.min(Number(query['limit'] ?? DEFAULT_LIMIT), MAX_LIMIT),
    offset: Number(query['offset'] ?? DEFAULT_OFFSET),
  };
}

/** Zod schema for creating an article. */
const createArticleSchema = z.object({
  title: z.string().min(1, 'is required'),
  description: z.string().min(1, 'is required'),
  body: z.string().min(1, 'is required'),
  tagList: z.array(z.string()).default([]),
});

/** Zod schema for updating an article. */
const updateArticleSchema = z.object({
  title: z.string().min(1, 'cannot be empty').optional(),
  description: z.string().min(1, 'cannot be empty').optional(),
  body: z.string().min(1, 'cannot be empty').optional(),
  tagList: z.array(z.string()).optional(),
});

/** Article response shape — list/feed versions omit body per 2024-08-16 performance spec. */
export interface ArticleResponseItem {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

/**
 * Formats an ArticleWithMeta into the API response shape.
 * @param article - The article with metadata.
 * @param includeBody - Whether to include the body field (false for list/feed per spec).
 */
function formatArticle(article: ArticleWithMeta, includeBody: boolean): ArticleResponseItem {
  const base = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited: article.favorited,
    favoritesCount: article.favoritesCount,
    author: article.author,
  };
  return includeBody ? { ...base, body: article.body } : base;
}

/**
 * Generates a URL-safe slug from a title.
 * @param title - The article title.
 * @returns Slug string.
 */
function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

/**
 * Service handling article CRUD, listing, feed, and favorite operations.
 * Depends on IArticleRepository (injected at composition root).
 */
export class ArticleService {
  constructor(private readonly articleRepository: IArticleRepository) {}

  /**
   * List articles with optional filters and pagination.
   * Body field is excluded from list results per 2024-08-16 performance spec.
   */
  async listArticles(
    query: Record<string, unknown>,
    currentUserId?: number,
  ): Promise<{ articles: ArticleResponseItem[]; articlesCount: number }> {
    const { limit, offset } = parsePagination(query);

    const result = await this.articleRepository.findAll(
      {
        tag: query['tag'] as string | undefined,
        author: query['author'] as string | undefined,
        favorited: query['favorited'] as string | undefined,
        limit,
        offset,
      },
      currentUserId,
    );

    return {
      articles: result.articles.map((a) => formatArticle(a, false)),
      articlesCount: result.articlesCount,
    };
  }

  /**
   * Get articles feed (from followed authors).
   * Body field is excluded from feed results per 2024-08-16 performance spec.
   */
  async getFeed(
    userId: number,
    query: Record<string, unknown>,
  ): Promise<{ articles: ArticleResponseItem[]; articlesCount: number }> {
    const { limit, offset } = parsePagination(query);

    const result = await this.articleRepository.findFeed(userId, limit, offset);
    return {
      articles: result.articles.map((a) => formatArticle(a, false)),
      articlesCount: result.articlesCount,
    };
  }

  /**
   * Get a single article by slug (includes body).
   */
  async getArticle(slug: string, currentUserId?: number): Promise<{ article: ArticleResponseItem }> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) {
      throw new NotFoundError('Article', slug);
    }
    return { article: formatArticle(article, true) };
  }

  /**
   * Create a new article.
   */
  async createArticle(
    authorId: number,
    input: unknown,
  ): Promise<{ article: ArticleResponseItem }> {
    const result = createArticleSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { title, description, body, tagList } = result.data;
    const slug = slugify(title);

    const article = await this.articleRepository.create({
      slug,
      title,
      description,
      body,
      authorId,
      tagList,
    });

    return { article: formatArticle(article, true) };
  }

  /**
   * Update an existing article. Only the author may update.
   */
  async updateArticle(
    slug: string,
    authorId: number,
    input: unknown,
  ): Promise<{ article: ArticleResponseItem }> {
    const existing = await this.articleRepository.findBySlug(slug, authorId);
    if (!existing) {
      throw new NotFoundError('Article', slug);
    }
    if (existing.authorId !== authorId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    const result = updateArticleSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { title, description, body, tagList } = result.data;
    const newSlug = title !== undefined ? slugify(title) : undefined;

    const updated = await this.articleRepository.update(
      slug,
      { slug: newSlug, title, description, body, tagList },
      authorId,
    );

    return { article: formatArticle(updated, true) };
  }

  /**
   * Delete an article. Only the author may delete.
   */
  async deleteArticle(slug: string, authorId: number): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug, authorId);
    if (!existing) {
      throw new NotFoundError('Article', slug);
    }
    if (existing.authorId !== authorId) {
      throw new ForbiddenError('Only the author can delete this article');
    }
    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article.
   */
  async favoriteArticle(
    slug: string,
    userId: number,
  ): Promise<{ article: ArticleResponseItem }> {
    const article = await this.articleRepository.favorite(slug, userId);
    return { article: formatArticle(article, true) };
  }

  /**
   * Unfavorite an article.
   */
  async unfavoriteArticle(
    slug: string,
    userId: number,
  ): Promise<{ article: ArticleResponseItem }> {
    const article = await this.articleRepository.unfavorite(slug, userId);
    return { article: formatArticle(article, true) };
  }
}

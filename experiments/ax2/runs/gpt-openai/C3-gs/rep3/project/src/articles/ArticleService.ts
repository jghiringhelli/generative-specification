import { randomUUID } from 'node:crypto';
import slugify from 'slugify';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import {
  ArticleQuery,
  ArticleRecord,
  IArticleRepository,
} from '../repositories/IArticleRepository';

export interface ArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: ReadonlyArray<string>;
}

export interface ArticleUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
}

export interface ArticleView {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export interface ArticlePage {
  readonly articles: ReadonlyArray<ArticleView>;
  readonly articlesCount: number;
}

export class ArticleService {
  public constructor(private readonly articles: IArticleRepository) {}

  /** Lists filtered articles without article bodies. */
  public async list(
    query: ArticleQuery,
    viewerId?: string,
  ): Promise<ArticlePage> {
    const [articles, articlesCount] = await Promise.all([
      this.articles.list(query),
      this.articles.count(query),
    ]);
    return {
      articles: articles.map((article) => this.toView(article, viewerId, false)),
      articlesCount,
    };
  }

  /** Lists followed-author articles without article bodies. */
  public async feed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ArticlePage> {
    const [articles, articlesCount] = await Promise.all([
      this.articles.feed(userId, limit, offset),
      this.articles.countFeed(userId),
    ]);
    return {
      articles: articles.map((article) => this.toView(article, userId, false)),
      articlesCount,
    };
  }

  /** Returns a single article including its body. */
  public async get(slug: string, viewerId?: string): Promise<ArticleView> {
    return this.toView(await this.requireArticle(slug), viewerId, true);
  }

  /** Creates an article for an authenticated author. */
  public async create(input: ArticleInput, authorId: string): Promise<ArticleView> {
    const slug = await this.createUniqueSlug(input.title);
    const article = await this.articles.create({
      slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId,
      tagList: [...new Set(input.tagList ?? [])],
    });
    return this.toView(article, authorId, true);
  }

  /** Updates an article when the caller is its author. */
  public async update(
    slug: string,
    input: ArticleUpdate,
    userId: string,
  ): Promise<ArticleView> {
    const article = await this.requireOwnedArticle(slug, userId);
    const nextSlug = input.title
      ? await this.createUniqueSlug(input.title, article.slug)
      : undefined;
    const updated = await this.articles.update(article.id, {
      ...input,
      ...(nextSlug ? { slug: nextSlug } : {}),
    });
    return this.toView(updated, userId, true);
  }

  /** Deletes an article when the caller is its author. */
  public async delete(slug: string, userId: string): Promise<void> {
    const article = await this.requireOwnedArticle(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Favorites an article for the authenticated user. */
  public async favorite(slug: string, userId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(article.id, userId);
    return this.get(slug, userId);
  }

  /** Removes an authenticated user's favorite from an article. */
  public async unfavorite(slug: string, userId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(article.id, userId);
    return this.get(slug, userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError(`Article ${slug} not found`);
    return article;
  }

  private async requireOwnedArticle(
    slug: string,
    userId: string,
  ): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError('Only the author may modify this article');
    }
    return article;
  }

  private async createUniqueSlug(title: string, current?: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true });
    if (base === current || !(await this.articles.findBySlug(base))) return base;
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  private toView(
    article: ArticleRecord,
    viewerId: string | undefined,
    includeBody: boolean,
  ): ArticleView {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      ...(includeBody ? { body: article.body } : {}),
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: viewerId ? article.favoritedByIds.includes(viewerId) : false,
      favoritesCount: article.favoritedByIds.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: viewerId
          ? article.author.followerIds.includes(viewerId)
          : false,
      },
    };
  }
}

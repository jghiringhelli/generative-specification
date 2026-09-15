import slugify from 'slugify';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type {
  ArticleFilters,
  ArticleRecord,
  IArticleRepository,
} from '../repositories/IArticleRepository';
import type { IProfileRepository } from '../repositories/IProfileRepository';

export interface ArticleAuthorResponse {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

export interface ArticleResponse {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body?: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleAuthorResponse;
}

export interface ArticleListResponse {
  readonly articles: ReadonlyArray<ArticleResponse>;
  readonly articlesCount: number;
}

export interface CreateArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList?: ReadonlyArray<string>;
}

export interface UpdateArticleInput {
  readonly title?: string;
  readonly description?: string;
  readonly body?: string;
}

export class ArticleService {
  public constructor(
    private readonly articles: IArticleRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /** Lists filtered articles without article bodies. */
  public async list(
    filters: ArticleFilters,
    viewerId?: string,
  ): Promise<ArticleListResponse> {
    const [records, articlesCount] = await Promise.all([
      this.articles.list(filters),
      this.articles.count(filters),
    ]);
    return {
      articles: await Promise.all(records.map((article) => this.toResponse(article, viewerId, false))),
      articlesCount,
    };
  }

  /** Lists followed-author articles without article bodies. */
  public async feed(
    viewerId: string,
    limit: number,
    offset: number,
  ): Promise<ArticleListResponse> {
    const [records, articlesCount] = await Promise.all([
      this.articles.feed(viewerId, limit, offset),
      this.articles.feedCount(viewerId),
    ]);
    return {
      articles: await Promise.all(records.map((article) => this.toResponse(article, viewerId, false))),
      articlesCount,
    };
  }

  /** Gets one article including its body. */
  public async get(slug: string, viewerId?: string): Promise<ArticleResponse> {
    return this.toResponse(await this.requireArticle(slug), viewerId, true);
  }

  /** Creates an article for an author. */
  public async create(
    authorId: string,
    input: CreateArticleInput,
  ): Promise<ArticleResponse> {
    const slug = await this.createUniqueSlug(input.title);
    const article = await this.articles.create({
      ...input,
      tagList: [...new Set(input.tagList ?? [])],
      slug,
      authorId,
    });
    return this.toResponse(article, authorId, true);
  }

  /** Updates an article owned by the authenticated user. */
  public async update(
    slug: string,
    userId: string,
    input: UpdateArticleInput,
  ): Promise<ArticleResponse> {
    const article = await this.requireOwnedArticle(slug, userId);
    const nextSlug = input.title ? await this.createUniqueSlug(input.title, article.slug) : undefined;
    const updated = await this.articles.update(article.id, { ...input, slug: nextSlug });
    return this.toResponse(updated, userId, true);
  }

  /** Deletes an article owned by the authenticated user. */
  public async delete(slug: string, userId: string): Promise<void> {
    const article = await this.requireOwnedArticle(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Favorites an article. */
  public async favorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    return this.toResponse(await this.articles.favorite(article.id, userId), userId, true);
  }

  /** Unfavorites an article. */
  public async unfavorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    return this.toResponse(await this.articles.unfavorite(article.id, userId), userId, true);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' was not found`);
    }
    return article;
  }

  private async requireOwnedArticle(slug: string, userId: string): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError('Only the author may modify this article');
    }
    return article;
  }

  private async createUniqueSlug(title: string, currentSlug?: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true }) || 'article';
    if (base === currentSlug || !(await this.articles.findBySlug(base))) {
      return base;
    }
    let suffix = 2;
    while (await this.articles.findBySlug(`${base}-${suffix}`)) {
      suffix += 1;
    }
    return `${base}-${suffix}`;
  }

  private async toResponse(
    article: ArticleRecord,
    viewerId: string | undefined,
    includeBody: boolean,
  ): Promise<ArticleResponse> {
    const [profile, favorited] = await Promise.all([
      this.profiles.findByUsername(article.author.username, viewerId),
      viewerId ? this.articles.isFavorited(article.id, viewerId) : false,
    ]);
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      ...(includeBody && { body: article.body }),
      tagList: article.tags.map((tag) => tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favoritedBy,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: profile?.following ?? false,
      },
    };
  }
}

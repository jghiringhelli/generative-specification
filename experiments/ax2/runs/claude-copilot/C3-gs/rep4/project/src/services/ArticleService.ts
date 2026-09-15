import { IArticleRepository } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { ArticleView, toArticleView } from '../dto/views';
import { ArticleWithAuthor } from '../domain/entities';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { generateSlug } from './slug';

export interface CreateArticleInput {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  description?: string;
  body?: string;
}

export interface ListArticlesInput {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

export interface FeedInput {
  limit: number;
  offset: number;
}

export interface ArticlesEnvelope {
  articles: ArticleView[];
  articlesCount: number;
}

/**
 * Business logic for articles: creation, retrieval, listing, feed, authorization
 * on mutation, and favoriting.
 */
export class ArticleService {
  constructor(
    private readonly articles: IArticleRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /** Create an article authored by the given user. */
  async createArticle(authorId: string, input: CreateArticleInput): Promise<ArticleView> {
    const article = await this.articles.create({
      slug: generateSlug(input.title),
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId,
    });
    return this.present(article, authorId, true);
  }

  /** Fetch a single article by slug. */
  async getArticle(slug: string, viewerId: string | null): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    return this.present(article, viewerId, true);
  }

  /** Update an article; only its author may do so. */
  async updateArticle(
    slug: string,
    viewerId: string,
    input: UpdateArticleInput,
  ): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, viewerId);

    const nextSlug = input.title && input.title !== article.title
      ? generateSlug(input.title)
      : undefined;

    const updated = await this.articles.update(article.id, {
      slug: nextSlug,
      title: input.title,
      description: input.description,
      body: input.body,
    });
    return this.present(updated, viewerId, true);
  }

  /** Delete an article; only its author may do so. */
  async deleteArticle(slug: string, viewerId: string): Promise<void> {
    const article = await this.requireArticle(slug);
    this.assertAuthor(article, viewerId);
    await this.articles.delete(article.id);
  }

  /** List articles with optional filters; body is omitted from list items. */
  async listArticles(input: ListArticlesInput, viewerId: string | null): Promise<ArticlesEnvelope> {
    const result = await this.articles.list(input);
    return this.presentMany(result.articles, result.articlesCount, viewerId);
  }

  /** List articles from followed authors; body is omitted from list items. */
  async feed(viewerId: string, input: FeedInput): Promise<ArticlesEnvelope> {
    const result = await this.articles.feed({ userId: viewerId, ...input });
    return this.presentMany(result.articles, result.articlesCount, viewerId);
  }

  /** Favorite an article on behalf of the viewer. */
  async favorite(slug: string, viewerId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(viewerId, article.id);
    const refreshed = await this.requireArticle(slug);
    return this.present(refreshed, viewerId, true);
  }

  /** Remove a favorite on behalf of the viewer. */
  async unfavorite(slug: string, viewerId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(viewerId, article.id);
    const refreshed = await this.requireArticle(slug);
    return this.present(refreshed, viewerId, true);
  }

  private async requireArticle(slug: string): Promise<ArticleWithAuthor> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('article not found');
    }
    return article;
  }

  private assertAuthor(article: ArticleWithAuthor, viewerId: string): void {
    if (article.authorId !== viewerId) {
      throw new ForbiddenError('you are not the author of this article');
    }
  }

  private async present(
    article: ArticleWithAuthor,
    viewerId: string | null,
    includeBody: boolean,
  ): Promise<ArticleView> {
    const following = viewerId
      ? await this.profiles.isFollowing(viewerId, article.authorId)
      : false;
    const favorited = viewerId
      ? await this.articles.isFavorited(viewerId, article.id)
      : false;
    return toArticleView(article, following, favorited, includeBody);
  }

  private async presentMany(
    articles: ArticleWithAuthor[],
    articlesCount: number,
    viewerId: string | null,
  ): Promise<ArticlesEnvelope> {
    const views = await Promise.all(
      articles.map((article) => this.present(article, viewerId, false)),
    );
    return { articles: views, articlesCount };
  }
}

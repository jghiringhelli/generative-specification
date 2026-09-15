import { IArticleRepository, ArticleFilters } from '../repositories/IArticleRepository';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleResponseData,
  SingleArticleResponseDTO,
  MultipleArticlesResponseDTO,
} from '../dtos/ArticleDTOs';
import { NotFoundError } from '../errors/AppError';

export class ArticleService {
  private readonly articleRepository: IArticleRepository;

  /**
   * Initializes article service with repository dependency.
   */
  constructor(articleRepository: IArticleRepository) {
    this.articleRepository = articleRepository;
  }

  /**
   * Formats a raw article entity into API response structure.
   */
  private formatArticle(entity: any, includeBody = true): ArticleResponseData {
    const formatted: ArticleResponseData = {
      slug: entity.slug,
      title: entity.title,
      description: entity.description,
      tagList: entity.tagList,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
      favorited: Boolean(entity.favorited),
      favoritesCount: entity.favoritesCount,
      author: entity.author,
    };

    if (includeBody && entity.body !== undefined) {
      formatted.body = entity.body;
    }

    return formatted;
  }

  /**
   * Lists articles according to query filters.
   * Specification Note (2024-08-16): GET /api/articles does NOT return the `body` field.
   */
  public async listArticles(
    filters: ArticleFilters,
    currentUserId?: string
  ): Promise<MultipleArticlesResponseDTO> {
    const { articles, articlesCount } = await this.articleRepository.findAll(filters, currentUserId);
    const mapped = articles.map((a) => this.formatArticle(a, false));
    return {
      articles: mapped,
      articlesCount,
    };
  }

  /**
   * Lists articles by followed authors.
   * Specification Note (2024-08-16): GET /api/articles/feed does NOT return the `body` field.
   */
  public async getFeed(
    currentUserId: string,
    pagination: { limit?: number; offset?: number }
  ): Promise<MultipleArticlesResponseDTO> {
    const { articles, articlesCount } = await this.articleRepository.findFeed(currentUserId, pagination);
    const mapped = articles.map((a) => this.formatArticle(a, false));
    return {
      articles: mapped,
      articlesCount,
    };
  }

  /**
   * Retrieves single article by slug including full markdown body.
   */
  public async getArticle(slug: string, currentUserId?: string): Promise<SingleArticleResponseDTO> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return { article: this.formatArticle(article, true) };
  }

  /**
   * Creates an article authored by the authenticated user.
   */
  public async createArticle(
    authorId: string,
    input: CreateArticleInput
  ): Promise<SingleArticleResponseDTO> {
    const created = await this.articleRepository.create({
      ...input,
      authorId,
    });
    return { article: this.formatArticle(created, true) };
  }

  /**
   * Updates an existing article if caller is the author.
   */
  public async updateArticle(
    slug: string,
    authorId: string,
    input: UpdateArticleInput
  ): Promise<SingleArticleResponseDTO> {
    const updated = await this.articleRepository.update(slug, input, authorId);
    return { article: this.formatArticle(updated, true) };
  }

  /**
   * Deletes an article by slug if caller is the author.
   */
  public async deleteArticle(slug: string, authorId: string): Promise<void> {
    await this.articleRepository.delete(slug, authorId);
  }

  /**
   * Adds article to authenticated user favorites.
   */
  public async favoriteArticle(slug: string, userId: string): Promise<SingleArticleResponseDTO> {
    const favorited = await this.articleRepository.favorite(slug, userId);
    return { article: this.formatArticle(favorited, true) };
  }

  /**
   * Removes article from authenticated user favorites.
   */
  public async unfavoriteArticle(slug: string, userId: string): Promise<SingleArticleResponseDTO> {
    const unfavorited = await this.articleRepository.unfavorite(slug, userId);
    return { article: this.formatArticle(unfavorited, true) };
  }
}

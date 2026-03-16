import { ArticleRepository } from '../repositories/article.repository';
import { NotFoundError } from '../errors/NotFoundError';
import { AuthorizationError } from '../errors/AuthorizationError';
import {
  ArticleDto,
  ArticleListItemDto,
  ArticleAuthor,
  SingleArticleResponse,
  MultipleArticlesResponse,
} from '../types/article.types';
import { ArticleFilters } from '../repositories/IArticleRepository';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_OFFSET } from '../config/constants';

export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  /**
   * List articles with optional filters and pagination
   */
  async listArticles(
    filters: ArticleFilters,
    currentUserId?: number
  ): Promise<MultipleArticlesResponse> {
    const limit = filters.limit || PAGINATION_DEFAULT_LIMIT;
    const offset = filters.offset || PAGINATION_DEFAULT_OFFSET;

    const { articles, count } = await this.articleRepository.findAll(
      { ...filters, limit, offset },
      currentUserId
    );

    return {
      articles: articles.map((article) => this.toArticleListItemDto(article, currentUserId)),
      articlesCount: count,
    };
  }

  /**
   * Get feed of articles from followed users
   */
  async getFeed(
    userId: number,
    limit: number = PAGINATION_DEFAULT_LIMIT,
    offset: number = PAGINATION_DEFAULT_OFFSET
  ): Promise<MultipleArticlesResponse> {
    const { articles, count } = await this.articleRepository.findFeed(
      userId,
      limit,
      offset,
      userId
    );

    return {
      articles: articles.map((article) => this.toArticleListItemDto(article, userId)),
      articlesCount: count,
    };
  }

  /**
   * Get a single article by slug
   */
  async getArticle(slug: string, currentUserId?: number): Promise<SingleArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);

    if (!article) {
      throw new NotFoundError('Article');
    }

    return {
      article: this.toArticleDto(article, currentUserId),
    };
  }

  /**
   * Create a new article
   */
  async createArticle(
    data: {
      title: string;
      description: string;
      body: string;
      tagList?: string[];
    },
    authorId: number
  ): Promise<SingleArticleResponse> {
    const article = await this.articleRepository.create({
      ...data,
      authorId,
    });

    return {
      article: this.toArticleDto(article, authorId),
    };
  }

  /**
   * Update an article
   * @throws NotFoundError if article doesn't exist
   * @throws AuthorizationError if user is not the author
   */
  async updateArticle(
    slug: string,
    data: {
      title?: string;
      description?: string;
      body?: string;
    },
    userId: number
  ): Promise<SingleArticleResponse> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article');
    }

    if (existing.author.id !== userId) {
      throw new AuthorizationError('only author can update article');
    }

    const article = await this.articleRepository.update(slug, data);

    return {
      article: this.toArticleDto(article, userId),
    };
  }

  /**
   * Delete an article
   * @throws NotFoundError if article doesn't exist
   * @throws AuthorizationError if user is not the author
   */
  async deleteArticle(slug: string, userId: number): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug);

    if (!existing) {
      throw new NotFoundError('Article');
    }

    if (existing.author.id !== userId) {
      throw new AuthorizationError('only author can delete article');
    }

    await this.articleRepository.delete(slug);
  }

  /**
   * Favorite an article
   */
  async favoriteArticle(slug: string, userId: number): Promise<SingleArticleResponse> {
    try {
      const article = await this.articleRepository.favorite(slug, userId);
      return {
        article: this.toArticleDto(article, userId),
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Article not found') {
        throw new NotFoundError('Article');
      }
      throw error;
    }
  }

  /**
   * Unfavorite an article
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<SingleArticleResponse> {
    try {
      const article = await this.articleRepository.unfavorite(slug, userId);
      return {
        article: this.toArticleDto(article, userId),
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Article not found') {
        throw new NotFoundError('Article');
      }
      throw error;
    }
  }

  /**
   * Convert repository article to full ArticleDto (includes body)
   */
  private toArticleDto(article: any, currentUserId?: number): ArticleDto {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t: any) => t.tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: currentUserId
        ? article.favoritedBy.some((f: any) => f.userId === currentUserId)
        : false,
      favoritesCount: article.favoritedBy.length,
      author: this.toAuthorDto(article.author, currentUserId),
    };
  }

  /**
   * Convert repository article to ArticleListItemDto (excludes body)
   */
  private toArticleListItemDto(article: any, currentUserId?: number): ArticleListItemDto {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      // Note: body field NOT included in list responses
      tagList: article.tags.map((t: any) => t.tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: currentUserId
        ? article.favoritedBy.some((f: any) => f.userId === currentUserId)
        : false,
      favoritesCount: article.favoritedBy.length,
      author: this.toAuthorDto(article.author, currentUserId),
    };
  }

  /**
   * Convert author data to ArticleAuthor DTO
   */
  private toAuthorDto(author: any, currentUserId?: number): ArticleAuthor {
    const following = currentUserId
      ? Array.isArray(author.followedBy) && author.followedBy.length > 0
      : false;

    return {
      username: author.username,
      bio: author.bio,
      image: author.image,
      following,
    };
  }
}

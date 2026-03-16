
/**
 * Article service.
 * Handles article CRUD, favorites, and feed generation.
 */

import type { IArticleRepository } from '../repositories/IArticleRepository';
import type { ITagRepository } from '../repositories/ITagRepository';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { NotFoundError } from '../errors/AppError';

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

export interface ArticleListItemResponse {
  slug: string;
  title: string;
  description: string;
  // Note: body NOT included in list responses (RealWorld spec 2024-08-16)
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

export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly tagRepository: ITagRepository
  ) {}

  /**
   * List articles with optional filters and pagination.
   */
  async listArticles(
    query: {
      tag?: string;
      author?: string;
      favorited?: string;
      limit?: number;
      offset?: number;
    },
    currentUserId: number | null
  ): Promise<{ articles: ArticleListItemResponse[]; articlesCount: number }> {
    return await this.articleRepository.list(query, currentUserId);
  }

  /**
   * Get feed of articles from followed users.
   * @throws UnauthorizedError if not authenticated
   */
  async getFeed(
    currentUserId: number,
    limit?: number,
    offset?: number
  ): Promise<{ articles: ArticleListItemResponse[]; articlesCount: number }> {
    return await this.articleRepository.getFeed(currentUserId, limit, offset);
  }

  /**
   * Get single article by slug.
   * @throws NotFoundError if article does not exist
   */
  async getArticle(slug: string, currentUserId: number | null): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    
    if (!article) {
      throw new NotFoundError('Article', slug);
    }

    return article;
  }

  /**
   * Create a new article.
   */
  async createArticle(
    data: {
      title: string;
      description: string;
      body: string;
      tagList: string[];
    },
    authorId: number
  ): Promise<ArticleResponse> {
    // Generate unique slug
    let slug = generateSlug(data.title);
    const exists = await this.articleRepository.slugExists(slug);
    
    if (exists) {
      slug = generateUniqueSlug(slug);
    }

    // Upsert tags
    if (data.tagList.length > 0) {
      await this.tagRepository.upsertMany(data.tagList);
    }

    // Create article
    return await this.articleRepository.create(
      {
        slug,
        title: data.title,
        description: data.description,
        body: data.body,
        tagList: data.tagList
      },
      authorId
    );
  }

  /**
   * Update an article.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  async updateArticle(
    slug: string,
    data: {
      title?: string;
      description?: string;
      body?: string;
    },
    currentUserId: number
  ): Promise<ArticleResponse> {
    return await this.articleRepository.update(slug, data, currentUserId);
  }

  /**
   * Delete an article.
   * @throws NotFoundError if article does not exist
   * @throws ForbiddenError if current user is not the author
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    await this.articleRepository.delete(slug, currentUserId);
  }

  /**
   * Favorite an article.
   * @throws NotFoundError if article does not exist
   */
  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    return await this.articleRepository.favorite(slug, userId);
  }

  /**
   * Unfavorite an article.
   * @throws NotFoundError if article does not exist
   */
  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    return await this.articleRepository.unfavorite(slug, userId);
  }
}

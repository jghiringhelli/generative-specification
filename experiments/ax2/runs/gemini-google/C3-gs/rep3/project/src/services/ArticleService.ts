// src/services/ArticleService.ts
import {
  IArticleRepository,
  ArticleRecord,
  ListArticlesFilter
} from '../repositories/IArticleRepository';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors/AppError';

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

export interface ArticleAuthorResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleSingleResponseDto {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthorResponse;
}

export interface ArticleListItemResponseDto {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: ArticleAuthorResponse;
}

export class ArticleService {
  constructor(private readonly articleRepository: IArticleRepository) {}

  public slugify(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${randomSuffix}`;
  }

  public toSingleDto(record: ArticleRecord): ArticleSingleResponseDto {
    return {
      slug: record.slug,
      title: record.title,
      description: record.description,
      body: record.body,
      tagList: record.tagList,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorited: record.favorited ?? false,
      favoritesCount: record.favoritesCount,
      author: {
        username: record.author.username,
        bio: record.author.bio,
        image: record.author.image,
        following: (record.author as any).following ?? false
      }
    };
  }

  public toListItemDto(record: ArticleRecord): ArticleListItemResponseDto {
    // Note: GET /api/articles and GET /api/articles/feed do NOT return body
    return {
      slug: record.slug,
      title: record.title,
      description: record.description,
      tagList: record.tagList,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorited: record.favorited ?? false,
      favoritesCount: record.favoritesCount,
      author: {
        username: record.author.username,
        bio: record.author.bio,
        image: record.author.image,
        following: (record.author as any).following ?? false
      }
    };
  }

  public async createArticle(
    userId: string,
    input: CreateArticleInput
  ): Promise<ArticleSingleResponseDto> {
    const errors: Record<string, string[]> = {};
    if (!input.title || !input.title.trim()) {
      errors.title = ["can't be blank"];
    }
    if (!input.description || !input.description.trim()) {
      errors.description = ["can't be blank"];
    }
    if (!input.body || !input.body.trim()) {
      errors.body = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    const slug = this.slugify(input.title);
    const article = await this.articleRepository.create({
      slug,
      title: input.title.trim(),
      description: input.description.trim(),
      body: input.body.trim(),
      tagList: input.tagList || [],
      authorId: userId
    });

    return this.toSingleDto(article);
  }

  public async getArticle(slug: string, currentUserId?: string): Promise<ArticleSingleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }
    return this.toSingleDto(article);
  }

  public async updateArticle(
    userId: string,
    slug: string,
    input: UpdateArticleInput
  ): Promise<ArticleSingleResponseDto> {
    const existing = await this.articleRepository.findBySlug(slug, userId);
    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own articles');
    }

    let newSlug: string | undefined;
    if (input.title && input.title.trim() && input.title.trim() !== existing.title) {
      newSlug = this.slugify(input.title);
    }

    const updated = await this.articleRepository.update(
      slug,
      {
        slug: newSlug,
        title: input.title,
        description: input.description,
        body: input.body
      },
      userId
    );

    return this.toSingleDto(updated);
  }

  public async deleteArticle(userId: string, slug: string): Promise<void> {
    const existing = await this.articleRepository.findBySlug(slug, userId);
    if (!existing) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own articles');
    }

    await this.articleRepository.delete(slug);
  }

  public async listArticles(
    filter: ListArticlesFilter
  ): Promise<{ articles: ArticleListItemResponseDto[]; articlesCount: number }> {
    const { articles, count } = await this.articleRepository.list(filter);
    return {
      articles: articles.map(a => this.toListItemDto(a)),
      articlesCount: count
    };
  }

  public async listFeed(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ articles: ArticleListItemResponseDto[]; articlesCount: number }> {
    const { articles, count } = await this.articleRepository.listFeed(userId, limit, offset);
    return {
      articles: articles.map(a => this.toListItemDto(a)),
      articlesCount: count
    };
  }

  public async favoriteArticle(userId: string, slug: string): Promise<ArticleSingleResponseDto> {
    const article = await this.articleRepository.favorite(userId, slug);
    return this.toSingleDto(article);
  }

  public async unfavoriteArticle(userId: string, slug: string): Promise<ArticleSingleResponseDto> {
    const article = await this.articleRepository.unfavorite(userId, slug);
    return this.toSingleDto(article);
  }
}

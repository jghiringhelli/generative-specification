// src/services/ArticleService.ts
import { IArticleRepository } from '../repositories/IArticleRepository';
import { Article, ArticleListItem, ArticleFilterOptions } from '../types';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface CreateArticleInput {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export class ArticleService {
  private articleRepository: IArticleRepository;

  constructor(articleRepository: IArticleRepository) {
    this.articleRepository = articleRepository;
  }

  async createArticle(authorId: string, input: CreateArticleInput): Promise<Article> {
    const errors: Record<string, string[]> = {};

    if (!input.title || input.title.trim() === '') {
      errors.title = ["can't be blank"];
    }
    if (!input.description || input.description.trim() === '') {
      errors.description = ["can't be blank"];
    }
    if (!input.body || input.body.trim() === '') {
      errors.body = ["can't be blank"];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    return this.articleRepository.create(authorId, {
      title: input.title!.trim(),
      description: input.description!.trim(),
      body: input.body!.trim(),
      tagList: input.tagList
    });
  }

  async getArticle(slug: string, currentUserId?: string): Promise<Article> {
    const article = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }
    return article;
  }

  async updateArticle(slug: string, authorId: string, input: UpdateArticleInput): Promise<Article> {
    return this.articleRepository.update(slug, authorId, {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.body !== undefined && { body: input.body.trim() }),
      ...(input.tagList !== undefined && { tagList: input.tagList })
    });
  }

  async deleteArticle(slug: string, authorId: string): Promise<void> {
    await this.articleRepository.delete(slug, authorId);
  }

  async listArticles(
    filter: ArticleFilterOptions,
    currentUserId?: string
  ): Promise<{ articles: ArticleListItem[]; articlesCount: number }> {
    return this.articleRepository.findMany(filter, currentUserId);
  }

  async getFeed(
    userId: string,
    options: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleListItem[]; articlesCount: number }> {
    return this.articleRepository.findFeed(userId, options);
  }

  async favoriteArticle(userId: string, slug: string): Promise<Article> {
    return this.articleRepository.favorite(userId, slug);
  }

  async unfavoriteArticle(userId: string, slug: string): Promise<Article> {
    return this.articleRepository.unfavorite(userId, slug);
  }
}

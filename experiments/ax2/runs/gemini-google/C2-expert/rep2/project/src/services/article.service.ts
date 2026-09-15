import { ArticleRepository, articleRepository, ArticleWithRelations, ArticleFilters } from '../repositories/article.repository';
import { ProfileRepository, profileRepository } from '../repositories/profile.repository';
import { generateSlug } from '../lib/slug';
import { parsePagination } from '../lib/pagination';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { ArticleResponse, ArticlesResponse, ArticleItem, ArticleListItem } from '../types';

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
  tagList?: string[];
}

export class ArticleService {
  constructor(
    private articleRepo: ArticleRepository = articleRepository,
    private profileRepo: ProfileRepository = profileRepository
  ) {}

  private async formatArticleItem(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleItem> {
    let following = false;
    if (currentUserId && currentUserId !== article.author.id) {
      following = await this.profileRepo.isFollowing(currentUserId, article.author.id);
    }

    const favorited = currentUserId
      ? article.favoritedBy.some((f) => f.userId === currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map((t) => t.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favoritedBy.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  private async formatArticleListItem(
    article: ArticleWithRelations,
    currentUserId?: number
  ): Promise<ArticleListItem> {
    let following = false;
    if (currentUserId && currentUserId !== article.author.id) {
      following = await this.profileRepo.isFollowing(currentUserId, article.author.id);
    }

    const favorited = currentUserId
      ? article.favoritedBy.some((f) => f.userId === currentUserId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map((t) => t.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article.favoritedBy.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  async createArticle(authorId: number, input: CreateArticleInput): Promise<ArticleResponse> {
    const slug = generateSlug(input.title);
    const article = await this.articleRepo.create({
      slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId,
      tagList: input.tagList
    });

    const formatted = await this.formatArticleItem(article, authorId);
    return { article: formatted };
  }

  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponse> {
    const article = await this.articleRepo.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    const formatted = await this.formatArticleItem(article, currentUserId);
    return { article: formatted };
  }

  async updateArticle(
    slug: string,
    authorId: number,
    input: UpdateArticleInput
  ): Promise<ArticleResponse> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to update this article');
    }

    let newSlug: string | undefined;
    if (input.title && input.title !== existing.title) {
      newSlug = generateSlug(input.title);
    }

    const updated = await this.articleRepo.update(slug, {
      slug: newSlug,
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList
    });

    const formatted = await this.formatArticleItem(updated, authorId);
    return { article: formatted };
  }

  async deleteArticle(slug: string, authorId: number): Promise<void> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to delete this article');
    }

    await this.articleRepo.delete(slug);
  }

  async favoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepo.favorite(userId, existing.id);
    const updated = await this.articleRepo.findBySlug(slug);
    const formatted = await this.formatArticleItem(updated!, userId);
    return { article: formatted };
  }

  async unfavoriteArticle(slug: string, userId: number): Promise<ArticleResponse> {
    const existing = await this.articleRepo.findBySlug(slug);
    if (!existing) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepo.unfavorite(userId, existing.id);
    const updated = await this.articleRepo.findBySlug(slug);
    const formatted = await this.formatArticleItem(updated!, userId);
    return { article: formatted };
  }

  async listArticles(
    filters: ArticleFilters,
    currentUserId?: number,
    rawLimit?: unknown,
    rawOffset?: unknown
  ): Promise<ArticlesResponse> {
    const { limit, offset } = parsePagination(rawLimit, rawOffset);
    const { articles, totalCount } = await this.articleRepo.findMany(filters, limit, offset);

    const items = await Promise.all(
      articles.map((article) => this.formatArticleListItem(article, currentUserId))
    );

    return {
      articles: items,
      articlesCount: totalCount
    };
  }

  async getFeed(
    userId: number,
    rawLimit?: unknown,
    rawOffset?: unknown
  ): Promise<ArticlesResponse> {
    const { limit, offset } = parsePagination(rawLimit, rawOffset);
    const { articles, totalCount } = await this.articleRepo.findFeed(userId, limit, offset);

    const items = await Promise.all(
      articles.map((article) => this.formatArticleListItem(article, userId))
    );

    return {
      articles: items,
      articlesCount: totalCount
    };
  }
}

export const articleService = new ArticleService();

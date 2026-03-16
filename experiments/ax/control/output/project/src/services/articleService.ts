import {
  ArticleRepository,
  ArticleWithRelations,
  ArticleFilters,
  PaginationParams
} from '../repositories/articleRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { generateSlug, updateSlug } from '../utils/slug';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../constants/pagination';

export interface ArticleResponse {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface ArticleListResponse {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface CreateArticleData {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  body?: string;
}

export class ArticleService {
  constructor(
    private articleRepository: ArticleRepository,
    private profileRepository: ProfileRepository
  ) {}

  async createArticle(
    authorId: string,
    data: CreateArticleData
  ): Promise<ArticleResponse> {
    const slug = generateSlug(data.title);

    const article = await this.articleRepository.create({
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId,
      tagList: data.tagList
    });

    return this.toArticleResponse(article, authorId);
  }

  async getArticle(
    slug: string,
    currentUserId?: string
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    return this.toArticleResponse(article, currentUserId);
  }

  async listArticles(
    filters: ArticleFilters,
    pagination: Partial<PaginationParams>,
    currentUserId?: string
  ): Promise<{ articles: ArticleListResponse[]; articlesCount: number }> {
    const limit = pagination.limit ?? DEFAULT_LIMIT;
    const offset = pagination.offset ?? DEFAULT_OFFSET;

    const [articles, count] = await Promise.all([
      this.articleRepository.findAll(filters, { limit, offset }),
      this.articleRepository.countArticles(filters)
    ]);

    const articleResponses = await Promise.all(
      articles.map(article => this.toArticleListResponse(article, currentUserId))
    );

    return {
      articles: articleResponses,
      articlesCount: count
    };
  }

  async getFeed(
    userId: string,
    pagination: Partial<PaginationParams>
  ): Promise<{ articles: ArticleListResponse[]; articlesCount: number }> {
    const limit = pagination.limit ?? DEFAULT_LIMIT;
    const offset = pagination.offset ?? DEFAULT_OFFSET;

    const [articles, count] = await Promise.all([
      this.articleRepository.findFeed(userId, { limit, offset }),
      this.articleRepository.countFeedArticles(userId)
    ]);

    const articleResponses = await Promise.all(
      articles.map(article => this.toArticleListResponse(article, userId))
    );

    return {
      articles: articleResponses,
      articlesCount: count
    };
  }

  async updateArticle(
    slug: string,
    userId: string,
    data: UpdateArticleData
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.authorId !== userId) {
      throw new Error('Forbidden: You are not the author of this article');
    }

    const updateData = { ...data };

    if (data.title) {
      updateData.slug = updateSlug(slug, data.title);
    }

    const updatedArticle = await this.articleRepository.update(
      slug,
      updateData
    );

    return this.toArticleResponse(updatedArticle, userId);
  }

  async deleteArticle(slug: string, userId: string): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.authorId !== userId) {
      throw new Error('Forbidden: You are not the author of this article');
    }

    await this.articleRepository.delete(slug);
  }

  async favoriteArticle(
    userId: string,
    slug: string
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    await this.articleRepository.favoriteArticle(userId, article.id);

    const updatedArticle = await this.articleRepository.findBySlug(slug);
    return this.toArticleResponse(updatedArticle!, userId);
  }

  async unfavoriteArticle(
    userId: string,
    slug: string
  ): Promise<ArticleResponse> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new Error('Article not found');
    }

    await this.articleRepository.unfavoriteArticle(userId, article.id);

    const updatedArticle = await this.articleRepository.findBySlug(slug);
    return this.toArticleResponse(updatedArticle!, userId);
  }

  private async toArticleResponse(
    article: ArticleWithRelations,
    currentUserId?: string
  ): Promise<ArticleResponse> {
    const favorited = currentUserId
      ? article.favorites.some(fav => fav.userId === currentUserId)
      : false;

    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, article.authorId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tags.map(tag => tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favorites,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }

  private async toArticleListResponse(
    article: ArticleWithRelations,
    currentUserId?: string
  ): Promise<ArticleListResponse> {
    const favorited = currentUserId
      ? article.favorites.some(fav => fav.userId === currentUserId)
      : false;

    const following = currentUserId
      ? await this.profileRepository.isFollowing(currentUserId, article.authorId)
      : false;

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map(tag => tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount: article._count.favorites,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following
      }
    };
  }
}

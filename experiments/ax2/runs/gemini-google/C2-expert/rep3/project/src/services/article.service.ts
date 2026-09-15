import { ForbiddenError, NotFoundError } from '../errors/app-error';
import { ArticleRepository, ArticleWithAuthorAndTags } from '../repositories/article.repository';
import { UserRepository } from '../repositories/user.repository';
import { ArticleListResponseDto, ArticleResponseDto } from '../types/article.types';
import { generateSlug } from '../utils/slug.util';
import {
  CreateArticleInput,
  FeedArticlesQuery,
  ListArticlesQuery,
  UpdateArticleInput,
} from '../validators/article.validator';

/**
 * Service managing article publication, browsing, feeding, and favoriting.
 */
export class ArticleService {
  private readonly articleRepository: ArticleRepository;
  private readonly userRepository: UserRepository;

  /**
   * Initializes ArticleService.
   */
  constructor(
    articleRepository: ArticleRepository = new ArticleRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.articleRepository = articleRepository;
    this.userRepository = userRepository;
  }

  /**
   * Creates a new article.
   */
  async createArticle(authorId: number, input: CreateArticleInput): Promise<ArticleResponseDto> {
    const slug = generateSlug(input.title);
    const created = await this.articleRepository.create({
      title: input.title,
      description: input.description,
      body: input.body,
      slug,
      authorId,
      tagList: input.tagList,
    });

    return this.toResponseDto(created, authorId, true);
  }

  /**
   * Retrieves a single article by slug.
   */
  async getArticle(slug: string, currentUserId?: number): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    return this.toResponseDto(article, currentUserId, true);
  }

  /**
   * Updates an existing article if caller is the author.
   */
  async updateArticle(
    slug: string,
    currentUserId: number,
    input: UpdateArticleInput
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    const newSlug = input.title ? generateSlug(input.title) : undefined;
    const updated = await this.articleRepository.update(article.id, {
      title: input.title,
      description: input.description,
      body: input.body,
      slug: newSlug,
      tagList: input.tagList,
    });

    return this.toResponseDto(updated, currentUserId, true);
  }

  /**
   * Deletes an article if caller is the author.
   */
  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    await this.articleRepository.delete(article.id);
  }

  /**
   * Lists articles with optional filters. Body is omitted from list items.
   */
  async listArticles(
    filters: ListArticlesQuery,
    currentUserId?: number
  ): Promise<ArticleListResponseDto> {
    const { articles, total } = await this.articleRepository.listArticles(filters);
    const mapped = await Promise.all(
      articles.map((item) => this.toResponseDto(item, currentUserId, false))
    );

    return {
      articles: mapped,
      articlesCount: total,
    };
  }

  /**
   * Lists articles from followed authors. Body is omitted from list items.
   */
  async listFeed(
    currentUserId: number,
    query: FeedArticlesQuery
  ): Promise<ArticleListResponseDto> {
    const { articles, total } = await this.articleRepository.listFeed(
      currentUserId,
      query.limit,
      query.offset
    );

    const mapped = await Promise.all(
      articles.map((item) => this.toResponseDto(item, currentUserId, false))
    );

    return {
      articles: mapped,
      articlesCount: total,
    };
  }

  /**
   * Favorites an article.
   */
  async favoriteArticle(slug: string, currentUserId: number): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    await this.articleRepository.favorite(currentUserId, article.id);
    const updated = await this.articleRepository.findById(article.id);
    return this.toResponseDto(updated!, currentUserId, true);
  }

  /**
   * Unfavorites an article.
   */
  async unfavoriteArticle(slug: string, currentUserId: number): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    await this.articleRepository.unfavorite(currentUserId, article.id);
    const updated = await this.articleRepository.findById(article.id);
    return this.toResponseDto(updated!, currentUserId, true);
  }

  /**
   * Formats an article database record into response DTO.
   */
  private async toResponseDto(
    article: ArticleWithAuthorAndTags,
    currentUserId?: number,
    includeBody = true
  ): Promise<ArticleResponseDto> {
    const isFavorited = currentUserId
      ? article.favorites.some((fav) => fav.userId === currentUserId)
      : false;

    let isFollowing = false;
    if (currentUserId && currentUserId !== article.authorId) {
      isFollowing = await this.userRepository.isFollowing(currentUserId, article.authorId);
    }

    const dto: ArticleResponseDto = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tags.map((t) => t.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: isFavorited,
      favoritesCount: article.favorites.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: isFollowing,
      },
    };

    if (includeBody) {
      dto.body = article.body;
    }

    return dto;
  }
}

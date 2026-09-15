import { IArticleRepository, ArticleEntity } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleQueryParams,
  ArticleFeedQueryParams,
} from '../validators/article.validator';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

export interface AuthorDTO {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ArticleDTO {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorDTO;
}

export interface ArticleListItemDTO {
  slug: string;
  title: string;
  description: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: AuthorDTO;
}

export class ArticleService {
  private readonly articleRepository: IArticleRepository;
  private readonly userRepository: IUserRepository;
  private readonly profileRepository: IProfileRepository;

  constructor(
    articleRepository: IArticleRepository,
    userRepository: IUserRepository,
    profileRepository: IProfileRepository
  ) {
    this.articleRepository = articleRepository;
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
  }

  private async buildAuthorDTO(
    authorId: string,
    currentUserId?: string
  ): Promise<AuthorDTO> {
    const author = await this.userRepository.findById(authorId);
    if (!author) {
      return {
        username: 'unknown',
        bio: '',
        image: '',
        following: false,
      };
    }

    let following = false;
    if (currentUserId && currentUserId !== author.id) {
      following = await this.profileRepository.isFollowing(currentUserId, author.id);
    }

    return {
      username: author.username,
      bio: author.bio ?? '',
      image: author.image ?? '',
      following,
    };
  }

  private async buildArticleDTO(
    article: ArticleEntity,
    currentUserId?: string
  ): Promise<ArticleDTO> {
    const author = await this.buildAuthorDTO(article.authorId, currentUserId);
    const favorited = currentUserId
      ? await this.articleRepository.isFavorited(article.id, currentUserId)
      : false;
    const favoritesCount = await this.articleRepository.getFavoritesCount(article.id);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author,
    };
  }

  private async buildArticleListItemDTO(
    article: ArticleEntity,
    currentUserId?: string
  ): Promise<ArticleListItemDTO> {
    const author = await this.buildAuthorDTO(article.authorId, currentUserId);
    const favorited = currentUserId
      ? await this.articleRepository.isFavorited(article.id, currentUserId)
      : false;
    const favoritesCount = await this.articleRepository.getFavoritesCount(article.id);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author,
    };
  }

  async listArticles(
    params: ArticleQueryParams,
    currentUserId?: string
  ): Promise<{ articles: ArticleListItemDTO[]; articlesCount: number }> {
    const { articles, articlesCount } = await this.articleRepository.list({
      tag: params.tag,
      author: params.author,
      favorited: params.favorited,
      limit: params.limit,
      offset: params.offset,
      currentUserId,
    });

    const mappedArticles = await Promise.all(
      articles.map((a) => this.buildArticleListItemDTO(a, currentUserId))
    );

    return {
      articles: mappedArticles,
      articlesCount,
    };
  }

  async feedArticles(
    params: ArticleFeedQueryParams,
    currentUserId: string
  ): Promise<{ articles: ArticleListItemDTO[]; articlesCount: number }> {
    const { articles, articlesCount } = await this.articleRepository.listFeed(
      currentUserId,
      {
        limit: params.limit,
        offset: params.offset,
      }
    );

    const mappedArticles = await Promise.all(
      articles.map((a) => this.buildArticleListItemDTO(a, currentUserId))
    );

    return {
      articles: mappedArticles,
      articlesCount,
    };
  }

  async getArticle(slug: string, currentUserId?: string): Promise<ArticleDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    return this.buildArticleDTO(article, currentUserId);
  }

  async createArticle(
    input: CreateArticleInput,
    authorId: string
  ): Promise<ArticleDTO> {
    const created = await this.articleRepository.create({
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: input.tagList ?? [],
      authorId,
    });

    return this.buildArticleDTO(created, authorId);
  }

  async updateArticle(
    slug: string,
    input: UpdateArticleInput,
    currentUserId: string
  ): Promise<ArticleDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can edit this article');
    }

    const updated = await this.articleRepository.update(slug, {
      title: input.title,
      description: input.description,
      body: input.body,
    });

    return this.buildArticleDTO(updated, currentUserId);
  }

  async deleteArticle(slug: string, currentUserId: string): Promise<void> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    await this.articleRepository.delete(slug);
  }

  async favoriteArticle(slug: string, currentUserId: string): Promise<ArticleDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepository.favorite(article.id, currentUserId);
    return this.buildArticleDTO(article, currentUserId);
  }

  async unfavoriteArticle(slug: string, currentUserId: string): Promise<ArticleDTO> {
    const article = await this.articleRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Article with slug '${slug}' not found`);
    }

    await this.articleRepository.unfavorite(article.id, currentUserId);
    return this.buildArticleDTO(article, currentUserId);
  }
}

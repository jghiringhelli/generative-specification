import { IArticleRepository } from '../repositories/IArticleRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import {
  ArticleResponse,
  ArticlesResponse,
  ArticleView,
} from '../types/responses';
import { Article } from '../types/domain';
import {
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../validators/articleSchemas';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { generateSlug } from '../utils/slug';

/** Optional filters for the public article list endpoint. */
export interface ListArticlesParams {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
}

/** Pagination parameters for the personalized feed endpoint. */
export interface FeedParams {
  limit: number;
  offset: number;
}

/** Orchestrates article CRUD, listing, feed, and favoriting. */
export class ArticleService {
  constructor(
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly follows: IProfileRepository,
  ) {}

  private async buildView(
    article: Article,
    viewerId: number | null,
    includeBody: boolean,
  ): Promise<ArticleView> {
    const author = await this.users.findById(article.authorId);
    if (!author) {
      throw new NotFoundError('Article author not found');
    }
    const [favorited, favoritesCount, following] = await Promise.all([
      viewerId !== null
        ? this.articles.isFavorited(viewerId, article.id)
        : Promise.resolve(false),
      this.articles.favoritesCount(article.id),
      viewerId !== null
        ? this.follows.isFollowing(viewerId, author.id)
        : Promise.resolve(false),
    ]);

    const view: ArticleView = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited,
      favoritesCount,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following,
      },
    };
    if (includeBody) {
      view.body = article.body;
    }
    return view;
  }

  private async requireArticle(slug: string): Promise<Article> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }
    return article;
  }

  async list(
    params: ListArticlesParams,
    viewerId: number | null,
  ): Promise<ArticlesResponse> {
    const { articles, total } = await this.articles.list(params);
    const views = await Promise.all(
      articles.map((a) => this.buildView(a, viewerId, false)),
    );
    return { articles: views, articlesCount: total };
  }

  async feed(
    userId: number,
    params: FeedParams,
  ): Promise<ArticlesResponse> {
    const { articles, total } = await this.articles.feed(userId, params);
    const views = await Promise.all(
      articles.map((a) => this.buildView(a, userId, false)),
    );
    return { articles: views, articlesCount: total };
  }

  async getBySlug(
    slug: string,
    viewerId: number | null,
  ): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    return { article: await this.buildView(article, viewerId, true) };
  }

  async create(
    input: CreateArticleRequest,
    authorId: number,
  ): Promise<ArticleResponse> {
    const { title, description, body, tagList } = input.article;
    const article = await this.articles.create({
      slug: generateSlug(title),
      title,
      description,
      body,
      authorId,
      tagList: tagList ?? [],
    });
    return { article: await this.buildView(article, authorId, true) };
  }

  async update(
    slug: string,
    input: UpdateArticleRequest,
    userId: number,
  ): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this article');
    }
    const { title, description, body } = input.article;
    const updated = await this.articles.update(article.id, {
      title,
      description,
      body,
      slug: title ? generateSlug(title) : undefined,
    });
    return { article: await this.buildView(updated, userId, true) };
  }

  async delete(slug: string, userId: number): Promise<void> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this article');
    }
    await this.articles.delete(article.id);
  }

  async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.addFavorite(userId, article.id);
    return { article: await this.buildView(article, userId, true) };
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.removeFavorite(userId, article.id);
    return { article: await this.buildView(article, userId, true) };
  }
}

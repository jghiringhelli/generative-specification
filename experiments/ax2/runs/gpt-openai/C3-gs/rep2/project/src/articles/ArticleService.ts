import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { IArticleRepository, ArticleRecord } from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../repositories/IUserRepository';
import {
  ArticleListItem,
  ArticleListResponse,
  ArticleResponse,
  CreateArticleCommand,
  ListArticlesQuery,
  UpdateArticleCommand,
} from './contracts';
import { SlugGenerator } from './ports';

export class ArticleService {
  public constructor(
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
    private readonly slugs: SlugGenerator,
  ) {}

  /** Lists articles using filters and pagination without article bodies. */
  public async list(query: ListArticlesQuery, viewerId?: string): Promise<ArticleListResponse> {
    const repositoryQuery = { ...query, favoritedBy: query.favorited };
    const [records, articlesCount] = await Promise.all([
      this.articles.list(repositoryQuery),
      this.articles.count(repositoryQuery),
    ]);
    const articleViews = await Promise.all(records.map((article) => this.view(article, viewerId)));
    return {
      articles: articleViews.map(({ body: _body, ...article }) => article),
      articlesCount,
    };
  }

  /** Lists followed authors' articles without article bodies. */
  public async feed(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ArticleListResponse> {
    const [records, articlesCount] = await Promise.all([
      this.articles.listFeed(userId, limit, offset),
      this.articles.countFeed(userId),
    ]);
    const views = await Promise.all(records.map((article) => this.view(article, userId)));
    return {
      articles: views.map(({ body: _body, ...article }) => article as ArticleListItem),
      articlesCount,
    };
  }

  /** Gets one complete article by slug. */
  public async get(slug: string, viewerId?: string): Promise<ArticleResponse> {
    return this.view(await this.requireArticle(slug), viewerId);
  }

  /** Creates an article owned by the authenticated user. */
  public async create(command: CreateArticleCommand, authorId: string): Promise<ArticleResponse> {
    const slug = await this.uniqueSlug(command.title);
    const article = await this.articles.create({
      ...command,
      tagList: command.tagList ?? [],
      slug,
      authorId,
    });
    return this.view(article, authorId);
  }

  /** Updates an article when the authenticated user is its author. */
  public async update(
    slug: string,
    command: UpdateArticleCommand,
    userId: string,
  ): Promise<ArticleResponse> {
    const current = await this.requireOwnedArticle(slug, userId);
    const nextSlug = command.title ? await this.uniqueSlug(command.title, current.slug) : undefined;
    const updated = await this.articles.update(current.id, { ...command, slug: nextSlug });
    return this.view(updated, userId);
  }

  /** Deletes an article when the authenticated user is its author. */
  public async delete(slug: string, userId: string): Promise<void> {
    const article = await this.requireOwnedArticle(slug, userId);
    await this.articles.delete(article.id);
  }

  /** Favorites an article for the authenticated user. */
  public async favorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(article.id, userId);
    return this.view(article, userId);
  }

  /** Removes an article favorite for the authenticated user. */
  public async unfavorite(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(article.id, userId);
    return this.view(article, userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article not found', { slug });
    }
    return article;
  }

  private async requireOwnedArticle(slug: string, userId: string): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) {
      throw new ForbiddenError('Only the article author may modify it', { slug, userId });
    }
    return article;
  }

  private async uniqueSlug(title: string, currentSlug?: string): Promise<string> {
    const base = this.slugs.generate(title);
    if (base === currentSlug || !(await this.articles.findBySlug(base))) {
      return base;
    }
    let suffix = 2;
    while (await this.articles.findBySlug(`${base}-${suffix}`)) {
      suffix += 1;
    }
    return `${base}-${suffix}`;
  }

  private async view(article: ArticleRecord, viewerId?: string): Promise<ArticleResponse> {
    const author = await this.requireAuthor(article.authorId);
    const [tagList, favoritesCount, favorited, following] = await Promise.all([
      this.articles.getTags(article.id),
      this.articles.countFavorites(article.id),
      viewerId ? this.articles.isFavorited(article.id, viewerId) : false,
      viewerId ? this.profiles.isFollowing(viewerId, author.id) : false,
    ]);
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList,
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
  }

  private async requireAuthor(authorId: string): Promise<UserRecord> {
    const author = await this.users.findById(authorId);
    if (!author) {
      throw new NotFoundError('Article author not found', { authorId });
    }
    return author;
  }
}

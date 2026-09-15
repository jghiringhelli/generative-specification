import slugify from 'slugify';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import {
  ArticleQuery,
  ArticleRecord,
  ArticleWrite,
  IArticleRepository,
} from '../repositories/IArticleRepository';
import { IProfileRepository } from '../repositories/IProfileRepository';
import { IUserRepository, UserRecord } from '../repositories/IUserRepository';

interface ArticleBase {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tagList: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: {
    readonly username: string;
    readonly bio: string | null;
    readonly image: string | null;
    readonly following: boolean;
  };
}

export interface ArticleView extends ArticleBase { readonly body: string; }
export type ArticleListView = ArticleBase;

export class ArticleService {
  public constructor(
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  public async list(
    query: ArticleQuery,
    viewerId?: string,
  ): Promise<{ articles: readonly ArticleListView[]; articlesCount: number }> {
    const result = await this.articles.list(query);
    return {
      articles: await Promise.all(result.articles.map((article) => this.toListView(article, viewerId))),
      articlesCount: result.count,
    };
  }

  public async get(slug: string, viewerId?: string): Promise<ArticleView> {
    return this.toView(await this.requireArticle(slug), viewerId);
  }

  public async create(authorId: string, input: ArticleWrite): Promise<ArticleView> {
    const article = await this.articles.create(authorId, this.slug(input.title), input);
    return this.toView(article, authorId);
  }

  public async update(
    slug: string,
    userId: string,
    input: Partial<ArticleWrite>,
  ): Promise<ArticleView> {
    const current = await this.requireOwned(slug, userId);
    const nextSlug = input.title ? this.slug(input.title) : current.slug;
    return this.toView(await this.articles.update(current.id, nextSlug, input), userId);
  }

  public async delete(slug: string, userId: string): Promise<void> {
    const article = await this.requireOwned(slug, userId);
    await this.articles.delete(article.id);
  }

  public async favorite(slug: string, userId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.favorite(article.id, userId);
    return this.toView(article, userId);
  }

  public async unfavorite(slug: string, userId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    await this.articles.unfavorite(article.id, userId);
    return this.toView(article, userId);
  }

  private async requireArticle(slug: string): Promise<ArticleRecord> {
    const article = await this.articles.findBySlug(slug);
    if (!article) throw new NotFoundError(`Article '${slug}' was not found`);
    return article;
  }

  private async requireOwned(slug: string, userId: string): Promise<ArticleRecord> {
    const article = await this.requireArticle(slug);
    if (article.authorId !== userId) throw new ForbiddenError('Only the author may modify this article');
    return article;
  }

  private async toListView(article: ArticleRecord, viewerId?: string): Promise<ArticleListView> {
    const { body: _body, ...view } = await this.toView(article, viewerId);
    return view;
  }

  private async toView(article: ArticleRecord, viewerId?: string): Promise<ArticleView> {
    const author = await this.requireAuthor(article.authorId);
    const [favorited, favoritesCount, following] = await Promise.all([
      viewerId ? this.articles.isFavorited(article.id, viewerId) : false,
      this.articles.favoriteCount(article.id),
      viewerId ? this.profiles.isFollowing(viewerId, author.id) : false,
    ]);
    return {
      slug: article.slug, title: article.title, description: article.description,
      body: article.body, tagList: article.tagList, createdAt: article.createdAt,
      updatedAt: article.updatedAt, favorited, favoritesCount,
      author: { username: author.username, bio: author.bio, image: author.image, following },
    };
  }

  private async requireAuthor(id: string): Promise<UserRecord> {
    const author = await this.users.findById(id);
    if (!author) throw new NotFoundError('Article author was not found');
    return author;
  }

  private slug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }
}

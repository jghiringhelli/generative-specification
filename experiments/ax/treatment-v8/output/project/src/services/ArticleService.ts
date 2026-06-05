/**
 * Application service for the Article aggregate: authoring, retrieval, the
 * personalized feed, and favoriting. It orchestrates the article, user, and
 * follow-graph ports; resolves filter usernames to ids; derives slugs; and
 * enforces author-only mutation. It contains no HTTP or framework concerns and
 * throws {@link AppError} subclasses the boundary maps to status codes.
 *
 * @gs-links: docs/specs/articles.md, docs/use-cases.md
 */
import { randomUUID } from 'node:crypto';
import { ForbiddenError, NotFoundError } from '../errors/AppError.js';
import type {
  Article,
  ArticleListQuery,
  IArticleRepository,
} from '../repositories/IArticleRepository.js';
import type { IProfileRepository } from '../repositories/IProfileRepository.js';
import type { IUserRepository } from '../repositories/IUserRepository.js';
import { slugify } from './slug.js';

/** The author projection embedded in an article view (viewer-relative `following`). */
export interface ArticleAuthorView {
  readonly username: string;
  readonly bio: string | null;
  readonly image: string | null;
  readonly following: boolean;
}

/** A fully-resolved article as the HTTP layer presents it (`favorited` is viewer-relative). */
export interface ArticleView {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly favorited: boolean;
  readonly favoritesCount: number;
  readonly author: ArticleAuthorView;
}

/** A page of resolved article views plus the total matching count. */
export interface ArticleListView {
  readonly articles: ReadonlyArray<ArticleView>;
  readonly articlesCount: number;
}

/** Fields needed to author a new article. */
export interface CreateArticleInput {
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: ReadonlyArray<string>;
}

/** Partial mutation set for an existing article (every field optional). */
export interface UpdateArticleInput {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly body?: string | undefined;
  readonly tagList?: ReadonlyArray<string> | undefined;
}

/** Filter + pagination for the global list, with filters as usernames/tags. */
export interface ListArticlesQuery {
  readonly tag?: string | undefined;
  readonly author?: string | undefined;
  readonly favorited?: string | undefined;
  readonly limit: number;
  readonly offset: number;
}

/** Pagination for the personalized feed. */
export interface FeedArticlesQuery {
  readonly limit: number;
  readonly offset: number;
}

export class ArticleService {
  constructor(
    private readonly articles: IArticleRepository,
    private readonly users: IUserRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  /**
   * List articles, newest first, filtered by tag/author/favoriter.
   *
   * An `author` or `favorited` filter naming a user who does not exist yields an
   * empty page (RealWorld semantics), never a 404.
   */
  async list(query: ListArticlesQuery, viewerId?: string): Promise<ArticleListView> {
    const repoQuery = await this.buildListQuery(query);
    if (repoQuery === null) {
      return { articles: [], articlesCount: 0 };
    }
    const page = await this.articles.list(repoQuery);
    return this.toListView(page.articles, page.total, viewerId);
  }

  /** The personalized feed: articles by the authors the viewer follows. */
  async feed(viewerId: string, query: FeedArticlesQuery): Promise<ArticleListView> {
    const authorIds = await this.profiles.listFollowedIds(viewerId);
    const page = await this.articles.feed({
      authorIds,
      limit: query.limit,
      offset: query.offset,
    });
    return this.toListView(page.articles, page.total, viewerId);
  }

  /** Fetch a single article by slug. @throws NotFoundError if absent. */
  async getBySlug(slug: string, viewerId?: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    return this.toView(article, viewerId);
  }

  /** Author a new article, ensuring a unique slug. */
  async create(authorId: string, input: CreateArticleInput): Promise<ArticleView> {
    const slug = await this.uniqueSlug(input.title);
    const article = await this.articles.create({
      slug,
      title: input.title,
      description: input.description,
      body: input.body,
      tagList: normalizeTags(input.tagList),
      authorId,
    });
    return this.toView(article, authorId);
  }

  /**
   * Update an article. Only the author may mutate it; changing the title
   * re-derives the slug.
   *
   * @throws NotFoundError if the slug is unknown.
   * @throws ForbiddenError if the caller is not the author.
   */
  async update(slug: string, authorId: string, changes: UpdateArticleInput): Promise<ArticleView> {
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, authorId);
    const newSlug =
      changes.title !== undefined && changes.title !== existing.title
        ? await this.uniqueSlug(changes.title)
        : undefined;
    const updated = await this.articles.update(slug, {
      ...(newSlug !== undefined ? { slug: newSlug } : {}),
      ...(changes.title !== undefined ? { title: changes.title } : {}),
      ...(changes.description !== undefined ? { description: changes.description } : {}),
      ...(changes.body !== undefined ? { body: changes.body } : {}),
      ...(changes.tagList !== undefined ? { tagList: normalizeTags(changes.tagList) } : {}),
    });
    return this.toView(updated, authorId);
  }

  /**
   * Soft-delete an article. Only the author may delete it.
   *
   * @throws NotFoundError if the slug is unknown.
   * @throws ForbiddenError if the caller is not the author.
   */
  async delete(slug: string, authorId: string): Promise<void> {
    const existing = await this.requireArticle(slug);
    this.assertAuthor(existing, authorId);
    await this.articles.delete(slug);
  }

  /**
   * List the distinct tag vocabulary across all non-deleted articles, sorted
   * alphabetically. Tags live on the article aggregate, so this is derived
   * from live articles rather than a separate tag store.
   */
  listTags(): Promise<ReadonlyArray<string>> {
    return this.articles.listTags();
  }

  /** Favorite an article on behalf of the viewer (idempotent). */
  async favorite(slug: string, viewerId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    const updated = await this.articles.addFavorite(article.id, viewerId);
    return this.toView(updated, viewerId);
  }

  /** Unfavorite an article on behalf of the viewer (idempotent). */
  async unfavorite(slug: string, viewerId: string): Promise<ArticleView> {
    const article = await this.requireArticle(slug);
    const updated = await this.articles.removeFavorite(article.id, viewerId);
    return this.toView(updated, viewerId);
  }

  /** Resolve filters to ids; returns `null` when a named user does not exist. */
  private async buildListQuery(query: ListArticlesQuery): Promise<ArticleListQuery | null> {
    let authorId: string | undefined;
    if (query.author !== undefined) {
      const author = await this.users.findByUsername(query.author);
      if (!author) return null;
      authorId = author.id;
    }
    let favoritedByUserId: string | undefined;
    if (query.favorited !== undefined) {
      const fan = await this.users.findByUsername(query.favorited);
      if (!fan) return null;
      favoritedByUserId = fan.id;
    }
    return {
      ...(query.tag !== undefined ? { tag: query.tag } : {}),
      ...(authorId !== undefined ? { authorId } : {}),
      ...(favoritedByUserId !== undefined ? { favoritedByUserId } : {}),
      limit: query.limit,
      offset: query.offset,
    };
  }

  /** Resolve a page of articles into views, preserving order. */
  private async toListView(
    articles: ReadonlyArray<Article>,
    total: number,
    viewerId?: string,
  ): Promise<ArticleListView> {
    const views = await Promise.all(articles.map((article) => this.toView(article, viewerId)));
    return { articles: views, articlesCount: total };
  }

  /** Resolve a domain article plus the viewer's relationship into a view. */
  private async toView(article: Article, viewerId?: string): Promise<ArticleView> {
    const [author, favorited] = await Promise.all([
      this.resolveAuthor(article.authorId, viewerId),
      viewerId !== undefined ? this.articles.isFavorited(article.id, viewerId) : Promise.resolve(false),
    ]);
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount: article.favoritesCount,
      author,
    };
  }

  /** Resolve an author id to the embedded profile, with viewer-relative `following`. */
  private async resolveAuthor(authorId: string, viewerId?: string): Promise<ArticleAuthorView> {
    const author = await this.users.findById(authorId);
    if (!author) {
      throw new NotFoundError('Author', authorId);
    }
    const following =
      viewerId !== undefined ? await this.profiles.isFollowing(viewerId, authorId) : false;
    return { username: author.username, bio: author.bio, image: author.image, following };
  }

  /** Derive a slug from the title, appending a suffix if it collides. */
  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if ((await this.articles.findBySlug(base)) === null) {
      return base;
    }
    return `${base}-${randomSuffix()}`;
  }

  /** Load an article by slug or throw a 404-mapping error. */
  private async requireArticle(slug: string): Promise<Article> {
    const article = await this.articles.findBySlug(slug);
    if (!article) {
      throw new NotFoundError('Article', slug);
    }
    return article;
  }

  /** Reject mutation by anyone other than the author. */
  private assertAuthor(article: Article, userId: string): void {
    if (article.authorId !== userId) {
      throw new ForbiddenError('You are not the author of this article', {
        article: ['forbidden'],
      });
    }
  }
}

/** Trim, drop empties, and de-duplicate a tag list. */
function normalizeTags(tags: ReadonlyArray<string>): ReadonlyArray<string> {
  const seen = new Set<string>();
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length > 0) seen.add(trimmed);
  }
  return [...seen];
}

/** Short, collision-resistant slug suffix (8 hex chars). */
function randomSuffix(): string {
  return randomUUID().slice(0, 8);
}

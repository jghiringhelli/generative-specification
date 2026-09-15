import { IUserRepository } from '../../src/repositories/IUserRepository';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { IArticleRepository, ArticleListResult } from '../../src/repositories/IArticleRepository';
import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { ITagRepository } from '../../src/repositories/ITagRepository';
import {
  Article,
  ArticleListFilter,
  Comment,
  CreateArticleInput,
  CreateCommentInput,
  CreateUserInput,
  FeedFilter,
  UpdateArticleInput,
  UpdateUserInput,
  User,
} from '../../src/types/domain';

/** In-memory user repository fake for tests. */
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private nextId = 1;

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.nextId++,
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return { ...user };
  }

  async findById(id: number): Promise<User | null> {
    const found = this.users.find((u) => u.id === id);
    return found ? { ...found } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = this.users.find((u) => u.email === email);
    return found ? { ...found } : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const found = this.users.find((u) => u.username === username);
    return found ? { ...found } : null;
  }

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    if (input.email !== undefined) user.email = input.email;
    if (input.username !== undefined) user.username = input.username;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.image !== undefined) user.image = input.image;
    if (input.passwordHash !== undefined) user.passwordHash = input.passwordHash;
    user.updatedAt = new Date();
    return { ...user };
  }
}

/** In-memory follow repository fake for tests. */
export class InMemoryProfileRepository implements IProfileRepository {
  private edges = new Set<string>();

  private key(a: number, b: number): string {
    return `${a}:${b}`;
  }

  async follow(followerId: number, followingId: number): Promise<void> {
    this.edges.add(this.key(followerId, followingId));
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    this.edges.delete(this.key(followerId, followingId));
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.edges.has(this.key(followerId, followingId));
  }
}

interface StoredArticle extends Article {
  favorites: Set<number>;
}

/** In-memory article repository fake for tests. */
export class InMemoryArticleRepository implements IArticleRepository {
  private articles: StoredArticle[] = [];
  private nextId = 1;
  private usernameResolver?: (authorId: number) => string | undefined;
  private favoritedByUsernameResolver?: (username: string) => number | undefined;

  constructor(private readonly follows: InMemoryProfileRepository) {}

  /** Test hook: resolve author usernames for the `author` filter. */
  setUsernameResolver(fn: (authorId: number) => string | undefined): void {
    this.usernameResolver = fn;
  }

  /** Test hook: resolve a username to a user id for the `favorited` filter. */
  setFavoritedUserResolver(fn: (username: string) => number | undefined): void {
    this.favoritedByUsernameResolver = fn;
  }

  /** All distinct tags currently attached to any stored article. */
  allTags(): string[] {
    return this.articles.flatMap((a) => a.tagList);
  }

  private clone(a: StoredArticle): Article {
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      body: a.body,
      authorId: a.authorId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      tagList: [...a.tagList],
    };
  }

  async create(input: CreateArticleInput): Promise<Article> {
    const now = new Date(Date.now() + this.nextId);
    const article: StoredArticle = {
      id: this.nextId++,
      slug: input.slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
      tagList: [...input.tagList].sort(),
      favorites: new Set<number>(),
    };
    this.articles.push(article);
    return this.clone(article);
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const found = this.articles.find((a) => a.slug === slug);
    return found ? this.clone(found) : null;
  }

  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    let items = [...this.articles].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    if (filter.tag) {
      items = items.filter((a) => a.tagList.includes(filter.tag as string));
    }
    if (filter.author && this.usernameResolver) {
      items = items.filter(
        (a) => this.usernameResolver?.(a.authorId) === filter.author,
      );
    }
    if (filter.favorited && this.favoritedByUsernameResolver) {
      const userId = this.favoritedByUsernameResolver(filter.favorited);
      items = items.filter(
        (a) => userId !== undefined && a.favorites.has(userId),
      );
    }
    const total = items.length;
    const page = items.slice(filter.offset, filter.offset + filter.limit);
    return { articles: page.map((a) => this.clone(a)), total };
  }

  async feed(userId: number, filter: FeedFilter): Promise<ArticleListResult> {
    const authored = await Promise.all(
      this.articles.map(async (a) => ({
        article: a,
        followed: await this.follows.isFollowing(userId, a.authorId),
      })),
    );
    const items = authored
      .filter((x) => x.followed)
      .map((x) => x.article)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const page = items.slice(filter.offset, filter.offset + filter.limit);
    return { articles: page.map((a) => this.clone(a)), total };
  }

  async update(id: number, input: UpdateArticleInput): Promise<Article> {
    const article = this.articles.find((a) => a.id === id);
    if (!article) {
      throw new Error('Article not found');
    }
    if (input.slug !== undefined) article.slug = input.slug;
    if (input.title !== undefined) article.title = input.title;
    if (input.description !== undefined) article.description = input.description;
    if (input.body !== undefined) article.body = input.body;
    article.updatedAt = new Date();
    return this.clone(article);
  }

  async delete(id: number): Promise<void> {
    this.articles = this.articles.filter((a) => a.id !== id);
  }

  async addFavorite(userId: number, articleId: number): Promise<void> {
    this.articles.find((a) => a.id === articleId)?.favorites.add(userId);
  }

  async removeFavorite(userId: number, articleId: number): Promise<void> {
    this.articles.find((a) => a.id === articleId)?.favorites.delete(userId);
  }

  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    return (
      this.articles.find((a) => a.id === articleId)?.favorites.has(userId) ??
      false
    );
  }

  async favoritesCount(articleId: number): Promise<number> {
    return this.articles.find((a) => a.id === articleId)?.favorites.size ?? 0;
  }
}

/** In-memory comment repository fake for tests. */
export class InMemoryCommentRepository implements ICommentRepository {
  private comments: Comment[] = [];
  private nextId = 1;

  async create(input: CreateCommentInput): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      id: this.nextId++,
      body: input.body,
      articleId: input.articleId,
      authorId: input.authorId,
      createdAt: now,
      updatedAt: now,
    };
    this.comments.push(comment);
    return { ...comment };
  }

  async findById(id: number): Promise<Comment | null> {
    const found = this.comments.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async findByArticleId(articleId: number): Promise<Comment[]> {
    return this.comments
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((c) => ({ ...c }));
  }

  async delete(id: number): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}

/** In-memory tag repository fake, backed by a live view of article tags. */
export class InMemoryTagRepository implements ITagRepository {
  constructor(private readonly source: () => string[]) {}

  async findAll(): Promise<string[]> {
    return Array.from(new Set(this.source())).sort();
  }
}

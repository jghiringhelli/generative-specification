import { IUserRepository } from '../../src/repositories/IUserRepository';
import { IProfileRepository } from '../../src/repositories/IProfileRepository';
import { IArticleRepository } from '../../src/repositories/IArticleRepository';
import { ICommentRepository } from '../../src/repositories/ICommentRepository';
import { ITagRepository } from '../../src/repositories/ITagRepository';
import {
  ArticleListFilter,
  ArticleListResult,
  ArticleWithAuthor,
  CommentWithAuthor,
  CreateArticleData,
  CreateCommentData,
  CreateUserData,
  FeedFilter,
  UpdateArticleData,
  UpdateUserData,
  UserEntity,
} from '../../src/domain/entities';

interface StoredArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  authorId: string;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shared in-memory backing store for the fake repositories. Enables full
 * integration tests through HTTP without a real database, exercising the same
 * ports the Prisma adapters implement.
 */
export class InMemoryStore {
  users = new Map<string, UserEntity>();
  articles = new Map<string, StoredArticle>();
  comments = new Map<number, CommentWithAuthor>();
  follows = new Set<string>();
  favorites = new Set<string>();
  private userSeq = 0;
  private articleSeq = 0;
  private commentSeq = 0;

  nextUserId(): string {
    this.userSeq += 1;
    return `user_${this.userSeq}`;
  }

  nextArticleId(): string {
    this.articleSeq += 1;
    return `article_${this.articleSeq}`;
  }

  nextCommentId(): number {
    this.commentSeq += 1;
    return this.commentSeq;
  }
}

const followKey = (follower: string, following: string): string => `${follower}:${following}`;
const favoriteKey = (user: string, article: string): string => `${user}:${article}`;

function toArticleWithAuthor(article: StoredArticle, author: UserEntity): ArticleWithAuthor {
  return { ...article, tagList: [...article.tagList].sort(), author };
}

export class InMemoryUserRepository implements IUserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const now = new Date();
    const user: UserEntity = {
      id: this.store.nextUserId(),
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      bio: null,
      image: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.store.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return [...this.store.users.values()].find((u) => u.email === email) ?? null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return [...this.store.users.values()].find((u) => u.username === username) ?? null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    const existing = this.store.users.get(id);
    if (!existing) {
      throw new Error('user not found');
    }
    const updated: UserEntity = {
      ...existing,
      email: data.email ?? existing.email,
      username: data.username ?? existing.username,
      passwordHash: data.passwordHash ?? existing.passwordHash,
      bio: data.bio === undefined ? existing.bio : data.bio,
      image: data.image === undefined ? existing.image : data.image,
      updatedAt: new Date(),
    };
    this.store.users.set(id, updated);
    return updated;
  }
}

export class InMemoryProfileRepository implements IProfileRepository {
  constructor(private readonly store: InMemoryStore) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    this.store.follows.add(followKey(followerId, followingId));
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    this.store.follows.delete(followKey(followerId, followingId));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.store.follows.has(followKey(followerId, followingId));
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    return [...this.store.users.values()].find((u) => u.username === username) ?? null;
  }
}

export class InMemoryTagRepository implements ITagRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAll(): Promise<string[]> {
    const tags = new Set<string>();
    for (const article of this.store.articles.values()) {
      article.tagList.forEach((tag) => tags.add(tag));
    }
    return [...tags].sort();
  }
}

export class InMemoryArticleRepository implements IArticleRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(data: CreateArticleData): Promise<ArticleWithAuthor> {
    const now = new Date();
    const article: StoredArticle = {
      id: this.store.nextArticleId(),
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: [...data.tagList],
      authorId: data.authorId,
      favoritesCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.store.articles.set(article.id, article);
    return toArticleWithAuthor(article, this.author(article.authorId));
  }

  async findBySlug(slug: string): Promise<ArticleWithAuthor | null> {
    const article = [...this.store.articles.values()].find((a) => a.slug === slug);
    return article ? toArticleWithAuthor(article, this.author(article.authorId)) : null;
  }

  async update(id: string, data: UpdateArticleData): Promise<ArticleWithAuthor> {
    const existing = this.store.articles.get(id);
    if (!existing) {
      throw new Error('article not found');
    }
    existing.slug = data.slug ?? existing.slug;
    existing.title = data.title ?? existing.title;
    existing.description = data.description ?? existing.description;
    existing.body = data.body ?? existing.body;
    existing.updatedAt = new Date();
    return toArticleWithAuthor(existing, this.author(existing.authorId));
  }

  async delete(id: string): Promise<void> {
    this.store.articles.delete(id);
  }

  async list(filter: ArticleListFilter): Promise<ArticleListResult> {
    let items = [...this.store.articles.values()];
    if (filter.tag) {
      items = items.filter((a) => a.tagList.includes(filter.tag as string));
    }
    if (filter.author) {
      items = items.filter((a) => this.author(a.authorId).username === filter.author);
    }
    if (filter.favorited) {
      const favUser = [...this.store.users.values()].find((u) => u.username === filter.favorited);
      items = favUser
        ? items.filter((a) => this.store.favorites.has(favoriteKey(favUser.id, a.id)))
        : [];
    }
    return this.paginate(items, filter.limit, filter.offset);
  }

  async feed(filter: FeedFilter): Promise<ArticleListResult> {
    const items = [...this.store.articles.values()].filter((a) =>
      this.store.follows.has(followKey(filter.userId, a.authorId)),
    );
    return this.paginate(items, filter.limit, filter.offset);
  }

  async favorite(userId: string, articleId: string): Promise<void> {
    const key = favoriteKey(userId, articleId);
    if (this.store.favorites.has(key)) {
      return;
    }
    this.store.favorites.add(key);
    const article = this.store.articles.get(articleId);
    if (article) {
      article.favoritesCount += 1;
    }
  }

  async unfavorite(userId: string, articleId: string): Promise<void> {
    const key = favoriteKey(userId, articleId);
    if (!this.store.favorites.has(key)) {
      return;
    }
    this.store.favorites.delete(key);
    const article = this.store.articles.get(articleId);
    if (article) {
      article.favoritesCount -= 1;
    }
  }

  async isFavorited(userId: string, articleId: string): Promise<boolean> {
    return this.store.favorites.has(favoriteKey(userId, articleId));
  }

  async favoritesCount(articleId: string): Promise<number> {
    return [...this.store.favorites].filter((key) => key.endsWith(`:${articleId}`)).length;
  }

  private author(authorId: string): UserEntity {
    const user = this.store.users.get(authorId);
    if (!user) {
      throw new Error('author not found');
    }
    return user;
  }

  private paginate(
    items: StoredArticle[],
    limit: number,
    offset: number,
  ): ArticleListResult {
    const sorted = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const page = sorted.slice(offset, offset + limit);
    return {
      articles: page.map((a) => toArticleWithAuthor(a, this.author(a.authorId))),
      articlesCount: sorted.length,
    };
  }
}

export class InMemoryCommentRepository implements ICommentRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const now = new Date();
    const author = this.store.users.get(data.authorId);
    if (!author) {
      throw new Error('author not found');
    }
    const comment: CommentWithAuthor = {
      id: this.store.nextCommentId(),
      body: data.body,
      articleId: data.articleId,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
      author,
    };
    this.store.comments.set(comment.id, comment);
    return comment;
  }

  async findById(id: number): Promise<CommentWithAuthor | null> {
    return this.store.comments.get(id) ?? null;
  }

  async listByArticle(articleId: string): Promise<CommentWithAuthor[]> {
    return [...this.store.comments.values()]
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async delete(id: number): Promise<void> {
    this.store.comments.delete(id);
  }
}

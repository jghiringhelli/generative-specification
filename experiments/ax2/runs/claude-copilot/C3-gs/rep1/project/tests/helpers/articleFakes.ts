import { Article, Tag, User } from '@prisma/client';
import {
  ArticleListFilter,
  ArticleWithRelations,
  CreateArticleData,
  IArticleRepository,
  UpdateArticleData,
} from '../../src/repositories/IArticleRepository';
import {
  CommentWithAuthor,
  CreateCommentData,
  ICommentRepository,
} from '../../src/repositories/ICommentRepository';
import { InMemoryStore } from './userFakes';

/**
 * Build Tag entities from names for view assembly.
 * @param names - Tag names.
 * @returns Tag entities with synthetic ids.
 */
function toTags(names: string[]): Tag[] {
  return names.map((name, index) => ({ id: index + 1, name }));
}

/**
 * In-memory implementation of IArticleRepository.
 */
export class InMemoryArticleRepository implements IArticleRepository {
  constructor(private readonly store: InMemoryStore) {}

  private author(authorId: number): User {
    const user = this.store.users.find((candidate) => candidate.id === authorId);
    if (!user) {
      throw new Error('author not found');
    }
    return user;
  }

  private withRelations(article: Article): ArticleWithRelations {
    return {
      ...article,
      author: this.author(article.authorId),
      tags: toTags(this.store.tagsByArticle.get(article.id) ?? []),
    };
  }

  async create(data: CreateArticleData): Promise<ArticleWithRelations> {
    const article: Article = {
      id: this.store.nextId(),
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId: data.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.articles.push(article);
    this.store.tagsByArticle.set(article.id, [...data.tagList]);
    return this.withRelations(article);
  }

  async findBySlug(slug: string): Promise<ArticleWithRelations | null> {
    const article = this.store.articles.find((candidate) => candidate.slug === slug);
    return article ? this.withRelations(article) : null;
  }

  private matches(article: Article, filter: ArticleListFilter): boolean {
    if (filter.tag) {
      const tags = this.store.tagsByArticle.get(article.id) ?? [];
      if (!tags.includes(filter.tag)) return false;
    }
    if (filter.author && this.author(article.authorId).username !== filter.author) {
      return false;
    }
    if (filter.favorited) {
      const favoriter = this.store.users.find((user) => user.username === filter.favorited);
      const favorited =
        favoriter !== undefined &&
        this.store.favorites.some(
          (favorite) => favorite.userId === favoriter.id && favorite.articleId === article.id,
        );
      if (!favorited) return false;
    }
    return true;
  }

  private sortedMatches(filter: ArticleListFilter): Article[] {
    return this.store.articles
      .filter((article) => this.matches(article, filter))
      .sort((left, right) => right.id - left.id);
  }

  async list(filter: ArticleListFilter): Promise<ArticleWithRelations[]> {
    return this.sortedMatches(filter)
      .slice(filter.offset, filter.offset + filter.limit)
      .map((article) => this.withRelations(article));
  }

  async count(filter: ArticleListFilter): Promise<number> {
    return this.sortedMatches(filter).length;
  }

  async feed(followedIds: number[], limit: number, offset: number): Promise<ArticleWithRelations[]> {
    return this.store.articles
      .filter((article) => followedIds.includes(article.authorId))
      .sort((left, right) => right.id - left.id)
      .slice(offset, offset + limit)
      .map((article) => this.withRelations(article));
  }

  async countFeed(followedIds: number[]): Promise<number> {
    return this.store.articles.filter((article) => followedIds.includes(article.authorId)).length;
  }

  async update(id: number, data: UpdateArticleData): Promise<ArticleWithRelations> {
    const article = this.store.articles.find((candidate) => candidate.id === id);
    if (!article) {
      throw new Error('article not found');
    }
    if (data.slug !== undefined) article.slug = data.slug;
    if (data.title !== undefined) article.title = data.title;
    if (data.description !== undefined) article.description = data.description;
    if (data.body !== undefined) article.body = data.body;
    article.updatedAt = new Date();
    return this.withRelations(article);
  }

  async delete(id: number): Promise<void> {
    this.store.articles = this.store.articles.filter((article) => article.id !== id);
    this.store.tagsByArticle.delete(id);
    this.store.favorites = this.store.favorites.filter((favorite) => favorite.articleId !== id);
  }

  async addFavorite(userId: number, articleId: number): Promise<void> {
    if (!(await this.isFavorited(userId, articleId))) {
      this.store.favorites.push({ userId, articleId });
    }
  }

  async removeFavorite(userId: number, articleId: number): Promise<void> {
    this.store.favorites = this.store.favorites.filter(
      (favorite) => !(favorite.userId === userId && favorite.articleId === articleId),
    );
  }

  async favoritesCount(articleId: number): Promise<number> {
    return this.store.favorites.filter((favorite) => favorite.articleId === articleId).length;
  }

  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    return this.store.favorites.some(
      (favorite) => favorite.userId === userId && favorite.articleId === articleId,
    );
  }
}

/**
 * In-memory implementation of ICommentRepository.
 */
export class InMemoryCommentRepository implements ICommentRepository {
  constructor(private readonly store: InMemoryStore) {}

  private author(authorId: number): User {
    const user = this.store.users.find((candidate) => candidate.id === authorId);
    if (!user) {
      throw new Error('author not found');
    }
    return user;
  }

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment = {
      id: this.store.nextId(),
      body: data.body,
      articleId: data.articleId,
      authorId: data.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.comments.push(comment);
    return { ...comment, author: this.author(comment.authorId) };
  }

  async findByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    return this.store.comments
      .filter((comment) => comment.articleId === articleId)
      .sort((left, right) => right.id - left.id)
      .map((comment) => ({ ...comment, author: this.author(comment.authorId) }));
  }

  async findById(id: number): Promise<CommentWithAuthor | null> {
    const comment = this.store.comments.find((candidate) => candidate.id === id);
    return comment ? { ...comment, author: this.author(comment.authorId) } : null;
  }

  async delete(id: number): Promise<void> {
    this.store.comments = this.store.comments.filter((comment) => comment.id !== id);
  }
}

import {
  IArticleRepository,
  ArticleEntity,
  ArticleFilters,
  CreateArticleData,
  UpdateArticleData,
} from '../IArticleRepository';
import { IUserRepository } from '../IUserRepository';
import { IProfileRepository } from '../IProfileRepository';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';
import slugify from 'slugify';

interface StoredArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export class InMemoryArticleRepository implements IArticleRepository {
  private readonly userRepository: IUserRepository;
  private readonly profileRepository: IProfileRepository;
  private articles: Map<string, StoredArticle> = new Map();
  private favorites: Set<string> = new Set();
  private nextId = 1;

  constructor(userRepository: IUserRepository, profileRepository: IProfileRepository) {
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true }) || 'article';
    let slug = baseSlug;
    let counter = 1;
    while ([...this.articles.values()].some((a) => a.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    return slug;
  }

  private async toArticleEntity(stored: StoredArticle, currentUserId?: string): Promise<ArticleEntity> {
    const author = await this.userRepository.findById(stored.authorId);
    const profile = await this.profileRepository.getProfile(author?.username || 'unknown', currentUserId);

    const favorited = currentUserId ? this.favorites.has(`${currentUserId}:${stored.id}`) : false;
    let favoritesCount = 0;
    for (const key of this.favorites) {
      if (key.endsWith(`:${stored.id}`)) {
        favoritesCount++;
      }
    }

    return {
      id: stored.id,
      slug: stored.slug,
      title: stored.title,
      description: stored.description,
      body: stored.body,
      tagList: [...stored.tagList],
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
      favorited,
      favoritesCount,
      author: profile || {
        username: author?.username || 'unknown',
        bio: author?.bio || null,
        image: author?.image || null,
        following: false,
      },
    };
  }

  async findBySlug(slug: string, currentUserId?: string): Promise<ArticleEntity | null> {
    const article = [...this.articles.values()].find((a) => a.slug === slug);
    if (!article) return null;
    return this.toArticleEntity(article, currentUserId);
  }

  async findAll(
    filters: ArticleFilters,
    currentUserId?: string
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    let list = [...this.articles.values()];

    if (filters.tag) {
      list = list.filter((a) => a.tagList.includes(filters.tag!));
    }

    if (filters.author) {
      const authorUser = await this.userRepository.findByUsername(filters.author);
      if (authorUser) {
        list = list.filter((a) => a.authorId === authorUser.id);
      } else {
        list = [];
      }
    }

    if (filters.favorited) {
      const favUser = await this.userRepository.findByUsername(filters.favorited);
      if (favUser) {
        list = list.filter((a) => this.favorites.has(`${favUser.id}:${a.id}`));
      } else {
        list = [];
      }
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalCount = list.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    const paginated = list.slice(offset, offset + limit);

    const entities = await Promise.all(paginated.map((a) => this.toArticleEntity(a, currentUserId)));
    return { articles: entities, articlesCount: totalCount };
  }

  async findFeed(
    currentUserId: string,
    pagination: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleEntity[]; articlesCount: number }> {
    const list = [...this.articles.values()];
    const filtered: StoredArticle[] = [];

    for (const article of list) {
      const author = await this.userRepository.findById(article.authorId);
      if (author) {
        const profile = await this.profileRepository.getProfile(author.username, currentUserId);
        if (profile?.following) {
          filtered.push(article);
        }
      }
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalCount = filtered.length;
    const offset = pagination.offset ?? 0;
    const limit = pagination.limit ?? 20;
    const paginated = filtered.slice(offset, offset + limit);

    const entities = await Promise.all(paginated.map((a) => this.toArticleEntity(a, currentUserId)));
    return { articles: entities, articlesCount: totalCount };
  }

  async create(data: CreateArticleData): Promise<ArticleEntity> {
    const id = `art-${this.nextId++}`;
    const slug = this.generateSlug(data.title);
    const now = new Date();

    const stored: StoredArticle = {
      id,
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: data.tagList,
      createdAt: now,
      updatedAt: now,
      authorId: data.authorId,
    };

    this.articles.set(id, stored);
    return this.toArticleEntity(stored, data.authorId);
  }

  async update(slug: string, data: UpdateArticleData, currentUserId?: string): Promise<ArticleEntity> {
    const article = [...this.articles.values()].find((a) => a.slug === slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    if (currentUserId && article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can update this article');
    }

    if (data.title && data.title !== article.title) {
      article.slug = this.generateSlug(data.title);
      article.title = data.title;
    }
    if (data.description !== undefined) {
      article.description = data.description;
    }
    if (data.body !== undefined) {
      article.body = data.body;
    }
    article.updatedAt = new Date();

    return this.toArticleEntity(article, currentUserId);
  }

  async delete(slug: string, currentUserId: string): Promise<void> {
    const article = [...this.articles.values()].find((a) => a.slug === slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenError('Only the author can delete this article');
    }

    this.articles.delete(article.id);
  }

  async favorite(slug: string, userId: string): Promise<ArticleEntity> {
    const article = [...this.articles.values()].find((a) => a.slug === slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    this.favorites.add(`${userId}:${article.id}`);
    return this.toArticleEntity(article, userId);
  }

  async unfavorite(slug: string, userId: string): Promise<ArticleEntity> {
    const article = [...this.articles.values()].find((a) => a.slug === slug);
    if (!article) {
      throw new NotFoundError('Article not found');
    }

    this.favorites.delete(`${userId}:${article.id}`);
    return this.toArticleEntity(article, userId);
  }

  clear(): void {
    this.articles.clear();
    this.favorites.clear();
    this.nextId = 1;
  }
}

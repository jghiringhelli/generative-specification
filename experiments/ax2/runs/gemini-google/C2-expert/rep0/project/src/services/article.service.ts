import { IArticleRepository, ArticleRepository } from '../repositories/article.repository';
import { ArticleMapper } from './article.mapper';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleFilterQuery,
  SingleArticleResponse,
  MultipleArticlesResponse
} from '../types/article.types';
import { generateSlug } from '../utils/slug.util';
import { parsePagination } from '../utils/pagination.util';
import { NotFoundError, ForbiddenError } from '../utils/error.util';

export interface IArticleService {
  createArticle(authorId: number, input: CreateArticleInput): Promise<SingleArticleResponse>;
  getArticle(slug: string, currentUserId?: number): Promise<SingleArticleResponse>;
  updateArticle(slug: string, authorId: number, input: UpdateArticleInput): Promise<SingleArticleResponse>;
  deleteArticle(slug: string, authorId: number): Promise<void>;
  favoriteArticle(slug: string, currentUserId: number): Promise<SingleArticleResponse>;
  unfavoriteArticle(slug: string, currentUserId: number): Promise<SingleArticleResponse>;
  listArticles(filters: ArticleFilterQuery, currentUserId?: number): Promise<MultipleArticlesResponse>;
  getFeed(currentUserId: number, limit?: unknown, offset?: unknown): Promise<MultipleArticlesResponse>;
}

export class ArticleService implements IArticleService {
  private readonly articleRepository: IArticleRepository;
  private readonly mapper: ArticleMapper;

  constructor(
    articleRepository: IArticleRepository = new ArticleRepository(),
    mapper: ArticleMapper = new ArticleMapper()
  ) {
    this.articleRepository = articleRepository;
    this.mapper = mapper;
  }

  public async createArticle(
    authorId: number,
    input: CreateArticleInput
  ): Promise<SingleArticleResponse> {
    const slug = generateSlug(input.title);
    const created = await this.articleRepository.create({
      slug,
      title: input.title,
      description: input.description,
      body: input.body,
      authorId,
      tagList: input.tagList
    });

    const articleData = await this.mapper.toSingleData(created, authorId);
    return { article: articleData };
  }

  public async getArticle(slug: string, currentUserId?: number): Promise<SingleArticleResponse> {
    const record = await this.articleRepository.findBySlug(slug);
    if (!record) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    const articleData = await this.mapper.toSingleData(record, currentUserId);
    return { article: articleData };
  }

  public async updateArticle(
    slug: string,
    authorId: number,
    input: UpdateArticleInput
  ): Promise<SingleArticleResponse> {
    const record = await this.articleRepository.findBySlug(slug);
    if (!record) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (record.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to update this article');
    }

    const newSlug = input.title ? generateSlug(input.title) : undefined;
    const updated = await this.articleRepository.update(record.id, {
      title: input.title,
      description: input.description,
      body: input.body,
      slug: newSlug,
      tagList: input.tagList
    });

    const articleData = await this.mapper.toSingleData(updated, authorId);
    return { article: articleData };
  }

  public async deleteArticle(slug: string, authorId: number): Promise<void> {
    const record = await this.articleRepository.findBySlug(slug);
    if (!record) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    if (record.authorId !== authorId) {
      throw new ForbiddenError('You are not authorized to delete this article');
    }

    await this.articleRepository.delete(record.id);
  }

  public async favoriteArticle(slug: string, currentUserId: number): Promise<SingleArticleResponse> {
    const record = await this.articleRepository.findBySlug(slug);
    if (!record) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    await this.articleRepository.favoriteArticle(currentUserId, record.id);
    const updated = await this.articleRepository.findBySlug(slug);
    const articleData = await this.mapper.toSingleData(updated || record, currentUserId);
    return { article: articleData };
  }

  public async unfavoriteArticle(slug: string, currentUserId: number): Promise<SingleArticleResponse> {
    const record = await this.articleRepository.findBySlug(slug);
    if (!record) {
      throw new NotFoundError(`Article '${slug}' not found`);
    }

    await this.articleRepository.unfavoriteArticle(currentUserId, record.id);
    const updated = await this.articleRepository.findBySlug(slug);
    const articleData = await this.mapper.toSingleData(updated || record, currentUserId);
    return { article: articleData };
  }

  public async listArticles(
    filters: ArticleFilterQuery,
    currentUserId?: number
  ): Promise<MultipleArticlesResponse> {
    const pagination = parsePagination(filters.limit, filters.offset);
    const { articles, totalCount } = await this.articleRepository.listArticles({
      tag: filters.tag,
      author: filters.author,
      favorited: filters.favorited,
      limit: pagination.limit,
      offset: pagination.offset
    });

    const items = await Promise.all(
      articles.map((record) => this.mapper.toListItem(record, currentUserId))
    );

    return { articles: items, articlesCount: totalCount };
  }

  public async getFeed(
    currentUserId: number,
    limit?: unknown,
    offset?: unknown
  ): Promise<MultipleArticlesResponse> {
    const pagination = parsePagination(limit, offset);
    const { articles, totalCount } = await this.articleRepository.feedArticles(
      currentUserId,
      pagination.limit,
      pagination.offset
    );

    const items = await Promise.all(
      articles.map((record) => this.mapper.toListItem(record, currentUserId))
    );

    return { articles: items, articlesCount: totalCount };
  }
}

/**
 * Thin HTTP adapter for the article endpoints: validate input, read the
 * path/identity, delegate to {@link ArticleService}, present the result. No
 * business logic (ownership, slugging, filtering) lives here — that is the
 * service's job; this layer only translates between HTTP and the service.
 *
 * @gs-links: docs/specs/articles.md, docs/use-cases.md
 */
import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../errors/AppError.js';
import type { ArticleService } from '../services/ArticleService.js';
import { toArticleListResponse, toArticleResponse } from './articlePresenter.js';
import {
  createArticleSchema,
  feedQuerySchema,
  listArticlesQuerySchema,
  updateArticleSchema,
} from './articleSchemas.js';
import { parseOrThrow } from './validation.js';

export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  /** GET /api/articles — public list with filters + pagination (body omitted). */
  async list(req: Request, res: Response): Promise<void> {
    const query = parseOrThrow(listArticlesQuerySchema, req.query);
    const page = await this.service.list(query, req.userId);
    res.status(200).json(toArticleListResponse(page.articles, page.articlesCount));
  }

  /** GET /api/articles/feed — articles by followed authors (auth required). */
  async feed(req: Request, res: Response): Promise<void> {
    const query = parseOrThrow(feedQuerySchema, req.query);
    const page = await this.service.feed(this.requireUserId(req), query);
    res.status(200).json(toArticleListResponse(page.articles, page.articlesCount));
  }

  /** GET /api/articles/:slug — public single article (includes body). */
  async get(req: Request, res: Response): Promise<void> {
    const article = await this.service.getBySlug(slug(req), req.userId);
    res.status(200).json(toArticleResponse(article));
  }

  /** POST /api/articles — author a new article (auth required). */
  async create(req: Request, res: Response): Promise<void> {
    const { article } = parseOrThrow(createArticleSchema, req.body);
    const created = await this.service.create(this.requireUserId(req), article);
    res.status(201).json(toArticleResponse(created));
  }

  /** PUT /api/articles/:slug — update an article (author only). */
  async update(req: Request, res: Response): Promise<void> {
    const { article } = parseOrThrow(updateArticleSchema, req.body);
    const updated = await this.service.update(slug(req), this.requireUserId(req), article);
    res.status(200).json(toArticleResponse(updated));
  }

  /** DELETE /api/articles/:slug — delete an article (author only). */
  async remove(req: Request, res: Response): Promise<void> {
    await this.service.delete(slug(req), this.requireUserId(req));
    res.status(204).end();
  }

  /** POST /api/articles/:slug/favorite — favorite the article (auth required). */
  async favorite(req: Request, res: Response): Promise<void> {
    const article = await this.service.favorite(slug(req), this.requireUserId(req));
    res.status(200).json(toArticleResponse(article));
  }

  /** DELETE /api/articles/:slug/favorite — unfavorite the article (auth required). */
  async unfavorite(req: Request, res: Response): Promise<void> {
    const article = await this.service.unfavorite(slug(req), this.requireUserId(req));
    res.status(200).json(toArticleResponse(article));
  }

  /** Read the id attached by `authenticate`; defensive guard for type-narrowing. */
  private requireUserId(req: Request): string {
    if (req.userId === undefined) {
      throw new UnauthorizedError();
    }
    return req.userId;
  }
}

/**
 * Read the `:slug` path segment. The route always binds it; this narrows the
 * `string | undefined` index type and is a defensive 404 if it were absent.
 */
function slug(req: Request): string {
  const value = req.params.slug;
  if (value === undefined) {
    throw new NotFoundError('Article');
  }
  return value;
}

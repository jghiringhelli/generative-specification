import { Request, Response } from 'express';
import { ArticleService } from '../services/ArticleService';
import { parseOrThrow } from '../validators/parse';
import {
  createArticleSchema,
  updateArticleSchema,
} from '../validators/articleSchemas';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Thin driving adapter for article endpoints. */
export class ArticleController {
  constructor(private readonly articles: ArticleService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.articles.list(
      {
        tag: optionalString(req.query.tag),
        author: optionalString(req.query.author),
        favorited: optionalString(req.query.favorited),
        limit: parsePositiveInt(req.query.limit, DEFAULT_LIMIT),
        offset: parsePositiveInt(req.query.offset, DEFAULT_OFFSET),
      },
      req.userId ?? null,
    );
    res.status(200).json(result);
  };

  feed = async (req: Request, res: Response): Promise<void> => {
    const result = await this.articles.feed(req.userId as number, {
      limit: parsePositiveInt(req.query.limit, DEFAULT_LIMIT),
      offset: parsePositiveInt(req.query.offset, DEFAULT_OFFSET),
    });
    res.status(200).json(result);
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const result = await this.articles.getBySlug(
      req.params.slug,
      req.userId ?? null,
    );
    res.status(200).json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(createArticleSchema, req.body);
    const result = await this.articles.create(input, req.userId as number);
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(updateArticleSchema, req.body);
    const result = await this.articles.update(
      req.params.slug,
      input,
      req.userId as number,
    );
    res.status(200).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.articles.delete(req.params.slug, req.userId as number);
    res.status(200).json({});
  };

  favorite = async (req: Request, res: Response): Promise<void> => {
    const result = await this.articles.favorite(
      req.params.slug,
      req.userId as number,
    );
    res.status(200).json(result);
  };

  unfavorite = async (req: Request, res: Response): Promise<void> => {
    const result = await this.articles.unfavorite(
      req.params.slug,
      req.userId as number,
    );
    res.status(200).json(result);
  };
}

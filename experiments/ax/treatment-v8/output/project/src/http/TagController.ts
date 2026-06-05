/**
 * Thin HTTP adapter for the tag endpoint: delegate to {@link ArticleService}
 * (tags live on the article aggregate), present the result. No business logic
 * lives here.
 *
 * @gs-links: docs/specs/tags.md, docs/use-cases.md
 */
import type { Request, Response } from 'express';
import type { ArticleService } from '../services/ArticleService.js';
import { toTagListResponse } from './tagPresenter.js';

export class TagController {
  constructor(private readonly service: ArticleService) {}

  /** GET /api/tags — public; the distinct tags appearing on any article. */
  async list(_req: Request, res: Response): Promise<void> {
    const tags = await this.service.listTags();
    res.status(200).json(toTagListResponse(tags));
  }
}

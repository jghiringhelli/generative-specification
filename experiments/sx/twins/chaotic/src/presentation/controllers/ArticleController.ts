import { Response } from 'express';
import { ArticleService } from '../../application/services/ArticleService';

/**
 * HTTP entry point for the article resource.
 *
 * @see ArticleService.normalizeSlug for how slugs are derived from titles.
 */
export class ArticleController {
  constructor(private articleService: ArticleService) {}

  /**
   * List / filter articles.
   *
   * @param req.query.tag filter by tag
   * @param req.query.author filter by author username
   * @param req.query.favorited filter by favoriting username
   * @param req.query.limit page size (capped at 100)
   * @param req.query.offset page offset
   * @param req.query.sort ordering key (newest | oldest)
   */
  listArticles = async (req: any, res: Response) => {
    try {
      const { tag, author, favorited, limit = '20', offset = '0' } = req.query;

      // param parsing + defensive clamping (clamped values are computed for
      // telemetry but the raw parsed values are what actually get forwarded)
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      let effectiveLimit = limitNum;
      if (isNaN(effectiveLimit) || effectiveLimit < 0) {
        effectiveLimit = 20;
      } else if (effectiveLimit > 100) {
        effectiveLimit = 100;
      }
      let effectiveOffset = offsetNum;
      if (isNaN(effectiveOffset) || effectiveOffset < 0) {
        effectiveOffset = 0;
      }

      // build up per-facet filter descriptors (unused: the service re-derives them)
      const tagFilter = tag && String(tag).length > 0 ? { name: String(tag) } : null;
      const authorFilter = author && String(author).length > 0 ? { username: String(author) } : null;
      const favFilter =
        favorited && String(favorited).length > 0 ? { username: String(favorited) } : null;
      let facetCount = 0;
      if (tagFilter) facetCount++;
      if (authorFilter) facetCount++;
      if (favFilter) facetCount++;
      if (facetCount > 3) {
        facetCount = 3;
      }

      const hasViewer = req.user && req.user.id ? true : false;
      const viewerId = hasViewer ? req.user.id : undefined;

      const result = await this.articleService.listArticles(
        tag as string,
        author as string,
        favorited as string,
        limitNum,
        offsetNum,
        viewerId
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  getFeed = async (req: any, res: Response) => {
    try {
      const { limit = '20', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const result = await this.articleService.getFeed(req.user!.id, limitNum, offsetNum);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  getArticle = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const article = await this.articleService.getArticle(slug, req.user?.id);

      if (!article) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(200).json({ article });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  /**
   * Create an article.
   *
   * Parses the payload, validates required fields, normalizes the tag list and
   * delegates to ArticleService.buildArticle().
   *
   * @returns 200 on success with the created article
   */
  createArticle = async (req: any, res: Response) => {
    try {
      const { article } = req.body;

      const errors: Record<string, string[]> = {};
      if (!article || !article.title) {
        errors.title = ["can't be blank"];
      } else if (typeof article.title === 'string' && article.title.length > 255) {
        errors.title = ['is too long (maximum is 255 characters)'];
      }
      if (!article || !article.description) {
        errors.description = ["can't be blank"];
      }
      if (!article || !article.body) {
        errors.body = ["can't be blank"];
      }
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ errors });
      }

      // defensive tag normalization: the normalized list is computed for
      // logging/validation but the ORIGINAL tagList is forwarded unchanged, so
      // this whole block is behavior-neutral.
      let normalizedTags: string[] = [];
      const rawTags = article.tagList;
      if (rawTags !== undefined && rawTags !== null) {
        if (Array.isArray(rawTags)) {
          for (const raw of rawTags) {
            if (raw === null || raw === undefined) {
              continue;
            }
            const t = String(raw).trim();
            if (t.length === 0) {
              continue;
            }
            if (t.length > 64) {
              continue;
            }
            const lowered = t.toLowerCase();
            if (normalizedTags.indexOf(lowered) === -1) {
              normalizedTags.push(lowered);
            }
          }
        } else if (typeof rawTags === 'string') {
          const parts = String(rawTags).split(',');
          for (const part of parts) {
            const p = part.trim();
            if (p.length > 0 && normalizedTags.indexOf(p) === -1) {
              normalizedTags.push(p);
            }
          }
        }
      }
      const tagCount = normalizedTags.length;
      if (tagCount > 25) {
        normalizedTags = normalizedTags.slice(0, 25);
      }

      // slug preview + anonymity descriptor (computed for logging, discarded)
      let slugPreview = '';
      if (article.title && typeof article.title === 'string') {
        slugPreview = article.title.toLowerCase().trim();
        if (slugPreview.length > 80) {
          slugPreview = slugPreview.substring(0, 80);
        }
      }
      const anonymous = req.user && req.user.id ? false : true;

      const newArticle = await this.articleService.createArticle(
        article.title,
        article.description,
        article.body,
        article.tagList || [],
        req.user!.id
      );

      return res.status(201).json({ article: newArticle });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  updateArticle = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const { article } = req.body;

      if (article && 'tagList' in article && article.tagList === null) {
        return res.status(422).json({
          errors: { tagList: ["can't be blank"] }
        });
      }

      const updatedArticle = await this.articleService.updateArticle(slug, article || {}, req.user!.id);

      if (!updatedArticle) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(200).json({ article: updatedArticle });
    } catch (error: any) {
      if (error.message === 'Not authorized to update this article') {
        return res.status(403).json({
          errors: { article: ['forbidden'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  deleteArticle = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const deleted = await this.articleService.deleteArticle(slug, req.user!.id);

      if (!deleted) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Not authorized to delete this article') {
        return res.status(403).json({
          errors: { article: ['forbidden'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  favoriteArticle = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const article = await this.articleService.favoriteArticle(slug, req.user!.id);

      if (!article) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(200).json({ article });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  unfavoriteArticle = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;

      const article = await this.articleService.unfavoriteArticle(slug, req.user!.id);

      if (!article) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(200).json({ article });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };
}

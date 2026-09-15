import { Router } from 'express';
import { ArticleRepository } from './article.repository';
import { ArticleService } from './article.service';
import { ProfileRepository } from '../profiles/profile.repository';
import {
  createArticleSchema,
  updateArticleSchema,
} from './article.validation';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const articleRepository = new ArticleRepository();
const profileRepository = new ProfileRepository();
const articleService = new ArticleService(articleRepository, profileRepository);

export const articlesRouter = Router();

articlesRouter.get(
  '/articles/feed',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await articleService.getFeed(
      req.user!.id,
      req.query.limit,
      req.query.offset,
    );
    res.status(200).json(result);
  }),
);

articlesRouter.get(
  '/articles',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const result = await articleService.listArticles(
      {
        tag: req.query.tag as string | undefined,
        author: req.query.author as string | undefined,
        favorited: req.query.favorited as string | undefined,
        limit: req.query.limit,
        offset: req.query.offset,
      },
      req.user?.id,
    );
    res.status(200).json(result);
  }),
);

articlesRouter.get(
  '/articles/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const result = await articleService.getArticle(
      req.params.slug,
      req.user?.id,
    );
    res.status(200).json(result);
  }),
);

articlesRouter.post(
  '/articles',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { article } = createArticleSchema.parse(req.body);
    const result = await articleService.createArticle(article, req.user!.id);
    res.status(201).json(result);
  }),
);

articlesRouter.put(
  '/articles/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { article } = updateArticleSchema.parse(req.body);
    const result = await articleService.updateArticle(
      req.params.slug,
      article,
      req.user!.id,
    );
    res.status(200).json(result);
  }),
);

articlesRouter.delete(
  '/articles/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    await articleService.deleteArticle(req.params.slug, req.user!.id);
    res.status(200).json({});
  }),
);

articlesRouter.post(
  '/articles/:slug/favorite',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await articleService.favoriteArticle(
      req.params.slug,
      req.user!.id,
    );
    res.status(200).json(result);
  }),
);

articlesRouter.delete(
  '/articles/:slug/favorite',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await articleService.unfavoriteArticle(
      req.params.slug,
      req.user!.id,
    );
    res.status(200).json(result);
  }),
);

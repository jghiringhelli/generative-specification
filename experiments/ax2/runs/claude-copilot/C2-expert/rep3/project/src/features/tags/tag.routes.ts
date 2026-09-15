import { Router } from 'express';
import { ArticleRepository } from '../articles/article.repository';
import { TagService } from './tag.service';
import { asyncHandler } from '../../utils/asyncHandler';

const articleRepository = new ArticleRepository();
const tagService = new TagService(articleRepository);

export const tagsRouter = Router();

tagsRouter.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const result = await tagService.listTags();
    res.status(200).json(result);
  }),
);

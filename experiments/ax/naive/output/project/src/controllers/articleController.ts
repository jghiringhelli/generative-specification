import { Request, Response, NextFunction } from 'express';
import * as articleService from '../services/articleService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const createArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    body: z.string().min(1),
    tagList: z.array(z.string()).optional()
  })
});

const updateArticleSchema = z.object({
  article: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    body: z.string().min(1).optional()
  })
});

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createArticleSchema.parse(req.body);
    const article = await articleService.createArticle(req.userId!, body.article);
    res.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function getArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.getArticle(slug, req.userId);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const body = updateArticleSchema.parse(req.body);
    const article = await articleService.updateArticle(slug, req.userId!, body.article);
    res.json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError(error.errors[0].message));
    } else {
      next(error);
    }
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    await articleService.deleteArticle(slug, req.userId!);
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
}

export async function listArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const { tag, author, favorited, limit, offset } = req.query;
    
    const query = {
      tag: tag as string | undefined,
      author: author as string | undefined,
      favorited: favorited as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };

    const result = await articleService.listArticles(query, req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = req.query;
    
    const result = await articleService.getFeed(
      req.userId!,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function favoriteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.favoriteArticle(slug, req.userId!);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

export async function unfavoriteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await articleService.unfavoriteArticle(slug, req.userId!);
    res.json({ article });
  } catch (error) {
    next(error);
  }
}

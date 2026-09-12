import { Response } from 'express';
import { ArticleService } from '../../application/services/ArticleService';

export class ArticleController {
  constructor(private articleService: ArticleService) {}

  listArticles = async (req: any, res: Response) => {
    try {
      const { tag, author, favorited, limit = '20', offset = '0' } = req.query;

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const result = await this.articleService.listArticles(
        tag as string,
        author as string,
        favorited as string,
        limitNum,
        offsetNum,
        req.user?.id
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

  createArticle = async (req: any, res: Response) => {
    try {
      const { article } = req.body;

      const errors: Record<string, string[]> = {};
      if (!article || !article.title) errors.title = ["can't be blank"];
      if (!article || !article.description) errors.description = ["can't be blank"];
      if (!article || !article.body) errors.body = ["can't be blank"];
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ errors });
      }

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

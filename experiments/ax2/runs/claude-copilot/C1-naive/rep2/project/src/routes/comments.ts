import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { isFollowing, toProfile } from '../utils/profile';

const router = Router();

const commentInclude = { author: true };

async function toComment(
  comment: {
    id: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    author: { id: number; username: string; bio: string | null; image: string | null };
  },
  currentUserId?: number
) {
  const following = await isFollowing(currentUserId, comment.author.id);
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: toProfile(comment.author, following),
  };
}

// GET /api/articles/:slug/comments
router.get(
  '/:slug/comments',
  optionalAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!article) throw new HttpError(404, 'Article not found');

      const comments = await prisma.comment.findMany({
        where: { articleId: article.id },
        include: commentInclude,
        orderBy: { createdAt: 'desc' },
      });
      const list = await Promise.all(
        comments.map((c) => toComment(c, req.user?.id))
      );
      res.json({ comments: list });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/articles/:slug/comments
router.post(
  '/:slug/comments',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!article) throw new HttpError(404, 'Article not found');

      const body = req.body?.comment;
      if (!body || !body.body)
        throw new HttpError(422, "body can't be blank");

      const comment = await prisma.comment.create({
        data: {
          body: body.body,
          authorId: req.user!.id,
          articleId: article.id,
        },
        include: commentInclude,
      });
      res
        .status(201)
        .json({ comment: await toComment(comment, req.user!.id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/articles/:slug/comments/:id
router.delete(
  '/:slug/comments/:id',
  requireAuth,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const article = await prisma.article.findUnique({
        where: { slug: req.params.slug },
      });
      if (!article) throw new HttpError(404, 'Article not found');

      const commentId = parseInt(req.params.id, 10);
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment || comment.articleId !== article.id)
        throw new HttpError(404, 'Comment not found');
      if (comment.authorId !== req.user!.id)
        throw new HttpError(403, 'You are not the author of this comment');

      await prisma.comment.delete({ where: { id: commentId } });
      res.status(200).json({});
    } catch (err) {
      next(err);
    }
  }
);

export default router;

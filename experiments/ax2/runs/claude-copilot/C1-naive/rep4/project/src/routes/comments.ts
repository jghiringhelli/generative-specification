import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { notFound, forbidden, unprocessable } from '../utils/errors';

const router = Router();

async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
}

interface CommentWithAuthor {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: number; username: string; bio: string; image: string };
}

async function toCommentJson(comment: CommentWithAuthor, currentUserId?: number) {
  const following = currentUserId ? await isFollowing(currentUserId, comment.author.id) : false;
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following,
    },
  };
}

// GET /api/articles/:slug/comments — get comments
router.get('/articles/:slug/comments', optionalAuth, async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) throw notFound('Article not found');

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });

  const commentsJson = await Promise.all(comments.map((c) => toCommentJson(c, req.user?.id)));
  res.json({ comments: commentsJson });
});

// POST /api/articles/:slug/comments — add comment
router.post('/articles/:slug/comments', requireAuth, async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) throw notFound('Article not found');

  const body = req.body?.comment?.body;
  if (!body) throw unprocessable({ body: ["can't be blank"] });

  const comment = await prisma.comment.create({
    data: { body, articleId: article.id, authorId: req.user!.id },
    include: { author: true },
  });

  res.status(201).json({ comment: await toCommentJson(comment, req.user!.id) });
});

// DELETE /api/articles/:slug/comments/:id — delete comment
router.delete('/articles/:slug/comments/:id', requireAuth, async (req: Request, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) throw notFound('Article not found');

  const commentId = parseInt(req.params.id, 10);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.articleId !== article.id) throw notFound('Comment not found');
  if (comment.authorId !== req.user!.id) throw forbidden('You are not the author');

  await prisma.comment.delete({ where: { id: commentId } });
  res.status(200).json({});
});

export default router;

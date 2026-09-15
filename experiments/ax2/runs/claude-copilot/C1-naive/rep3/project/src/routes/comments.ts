import { Router, Response } from 'express';
import prisma from '../prisma';
import { auth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

async function toCommentResponse(
  comment: {
    id: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    author: { username: string; bio: string | null; image: string | null };
  },
  currentUserId?: number
) {
  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: currentUserId, followingId: comment.authorId },
      },
    });
    following = !!follow;
  }
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio || '',
      image: comment.author.image || '',
      following,
    },
  };
}

// GET /api/articles/:slug/comments — get comments
router.get('/articles/:slug/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  const serialized = await Promise.all(comments.map((c) => toCommentResponse(c, req.user?.id)));
  return res.json({ comments: serialized });
});

// POST /api/articles/:slug/comments — add comment
router.post('/articles/:slug/comments', auth, async (req: AuthRequest, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const body = req.body?.comment?.body;
  if (!body) {
    return res.status(422).json({ errors: { body: ["can't be blank"] } });
  }
  const comment = await prisma.comment.create({
    data: { body, articleId: article.id, authorId: req.user!.id },
    include: { author: true },
  });
  return res.status(201).json({ comment: await toCommentResponse(comment, req.user!.id) });
});

// DELETE /api/articles/:slug/comments/:id — delete comment
router.delete('/articles/:slug/comments/:id', auth, async (req: AuthRequest, res: Response) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const commentId = parseInt(req.params.id, 10);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return res.status(404).json({ errors: { body: ['comment not found'] } });
  }
  if (comment.authorId !== req.user!.id) {
    return res.status(403).json({ errors: { body: ['forbidden'] } });
  }
  await prisma.comment.delete({ where: { id: commentId } });
  return res.status(200).json({});
});

export default router;

import { Router, Response } from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const commentInclude = {
  author: {
    include: {
      followedBy: true
    }
  }
};

function formatComment(comment: any, currentUserId?: number) {
  let following = false;
  if (currentUserId && comment.author?.followedBy && Array.isArray(comment.author.followedBy)) {
    following = comment.author.followedBy.some(
      (f: any) => f.followerId === currentUserId
    );
  }

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author?.username,
      bio: comment.author?.bio ?? '',
      image: comment.author?.image ?? null,
      following
    }
  };
}

// GET /api/articles/:slug/comments - get comments for an article
router.get('/articles/:slug/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      include: commentInclude,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      comments: comments.map((c) => formatComment(c, req.userId))
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// POST /api/articles/:slug/comments - add comment to an article
router.post('/articles/:slug/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const { comment } = req.body || {};

  if (!comment || !comment.body) {
    return res.status(422).json({
      errors: {
        body: ["comment body can't be empty"]
      }
    });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    const createdComment = await prisma.comment.create({
      data: {
        body: comment.body,
        articleId: article.id,
        authorId: req.userId!
      },
      include: commentInclude
    });

    return res.status(201).json({
      comment: formatComment(createdComment, req.userId)
    });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

// DELETE /api/articles/:slug/comments/:id - delete a comment
router.delete('/articles/:slug/comments/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { slug, id } = req.params;
  const commentId = parseInt(id, 10);

  if (isNaN(commentId)) {
    return res.status(422).json({ errors: { comment: ['invalid comment ID'] } });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { article: ['not found'] } });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ errors: { comment: ['not found'] } });
    }

    if (comment.articleId !== article.id) {
      return res.status(404).json({ errors: { comment: ['not found for this article'] } });
    }

    if (comment.authorId !== req.userId) {
      return res.status(403).json({ errors: { comment: ['forbidden'] } });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return res.status(200).json({ message: 'Comment successfully deleted' });
  } catch (error: any) {
    return res.status(500).json({ errors: { message: [error.message || 'Server error'] } });
  }
});

export default router;

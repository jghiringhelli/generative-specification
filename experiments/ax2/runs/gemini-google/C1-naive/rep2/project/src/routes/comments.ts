import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function formatComment(comment: any, currentUserId?: number) {
  const following = currentUserId
    ? comment.author?.followedBy?.some((f: any) => f.followerId === currentUserId) ?? false
    : false;

  return {
    id: comment.id,
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
    updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following,
    },
  };
}

// GET /api/articles/:slug/comments - Get comments for an article
router.get('/articles/:slug/comments', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug } = req.params;
  const currentUserId = req.user?.id;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: {
      author: {
        include: {
          followedBy: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    comments: comments.map((c) => formatComment(c, currentUserId)),
  });
});

// POST /api/articles/:slug/comments - Add comment to an article
router.post('/articles/:slug/comments', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug } = req.params;
  const currentUser = req.user!;
  const { comment } = req.body || {};

  if (!comment) {
    res.status(422).json({
      errors: { body: ['comment object is required'] },
    });
    return;
  }

  if (!comment.body) {
    res.status(422).json({
      errors: { body: ["can't be blank"] },
    });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  const newComment = await prisma.comment.create({
    data: {
      body: comment.body,
      authorId: currentUser.id,
      articleId: article.id,
    },
    include: {
      author: {
        include: {
          followedBy: true,
        },
      },
    },
  });

  res.status(200).json({
    comment: formatComment(newComment, currentUser.id),
  });
});

// DELETE /api/articles/:slug/comments/:id - Delete a comment
router.delete('/articles/:slug/comments/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug, id } = req.params;
  const currentUser = req.user!;
  const commentId = parseInt(id, 10);

  if (isNaN(commentId)) {
    res.status(422).json({
      errors: { comment: ['id must be an integer'] },
    });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    res.status(404).json({
      errors: { article: ['not found'] },
    });
    return;
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment || comment.articleId !== article.id) {
    res.status(404).json({
      errors: { comment: ['not found'] },
    });
    return;
  }

  if (comment.authorId !== currentUser.id) {
    res.status(403).json({
      errors: { comment: ['forbidden: you are not the author'] },
    });
    return;
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  res.status(200).json({
    message: 'Comment deleted successfully',
  });
});

export default router;

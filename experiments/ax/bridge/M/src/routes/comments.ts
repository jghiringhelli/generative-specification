import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

interface CommentAuthor {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

interface CommentResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: CommentAuthor;
}

const buildCommentResponse = async (
  comment: any,
  currentUserId?: number
): Promise<CommentResponse> => {
  const author = await prisma.user.findUnique({
    where: { id: comment.authorId }
  });

  let following = false;
  if (currentUserId && author) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: author.id
        }
      }
    });
    following = !!followRecord;
  }

  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: {
      username: author!.username,
      bio: author!.bio,
      image: author!.image,
      following
    }
  };
};

// GET /api/articles/:slug/comments - Get comments
router.get(
  '/articles/:slug/comments',
  optionalAuthenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      const comments = await prisma.comment.findMany({
        where: { articleId: article.id },
        orderBy: { createdAt: 'desc' }
      });

      const commentsResponse = await Promise.all(
        comments.map((comment) =>
          buildCommentResponse(comment, req.user?.id)
        )
      );

      return res.status(200).json({ comments: commentsResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// POST /api/articles/:slug/comments - Add comment
router.post(
  '/articles/:slug/comments',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const { comment } = req.body;

      if (!comment || !comment.body) {
        return res.status(422).json({
          errors: { body: ['Comment body is required'] }
        });
      }

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      const newComment = await prisma.comment.create({
        data: {
          body: comment.body,
          authorId: req.user!.id,
          articleId: article.id
        }
      });

      const commentResponse = await buildCommentResponse(
        newComment,
        req.user!.id
      );

      return res.status(201).json({ comment: commentResponse });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

// DELETE /api/articles/:slug/comments/:id - Delete comment
router.delete(
  '/articles/:slug/comments/:id',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { slug, id } = req.params;
      const commentId = parseInt(id);

      const article = await prisma.article.findUnique({
        where: { slug }
      });

      if (!article) {
        return res.status(404).json({
          errors: { body: ['Article not found'] }
        });
      }

      const comment = await prisma.comment.findUnique({
        where: { id: commentId }
      });

      if (!comment) {
        return res.status(404).json({
          errors: { body: ['Comment not found'] }
        });
      }

      if (comment.articleId !== article.id) {
        return res.status(404).json({
          errors: { body: ['Comment not found'] }
        });
      }

      if (comment.authorId !== req.user!.id) {
        return res.status(403).json({
          errors: { body: ['Not authorized to delete this comment'] }
        });
      }

      await prisma.comment.delete({
        where: { id: commentId }
      });

      return res.status(200).json({});
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  }
);

export default router;

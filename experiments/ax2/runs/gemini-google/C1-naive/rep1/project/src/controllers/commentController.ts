import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

function formatComment(comment: any, currentUserId?: number) {
  const isFollowing = currentUserId
    ? comment.author?.followedBy?.some((f: any) => f.followerId === currentUserId) ?? false
    : false;

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio || '',
      image: comment.author.image || '',
      following: isFollowing
    }
  };
}

export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            followedBy: true
          }
        }
      }
    });

    res.status(200).json({
      comments: comments.map(c => formatComment(c, req.user?.id))
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug } = req.params;
    const { comment } = req.body || {};

    if (!comment || !comment.body) {
      res.status(422).json({ errors: { body: ["can't be blank"] } });
      return;
    }

    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    const newComment = await prisma.comment.create({
      data: {
        body: comment.body,
        authorId: req.user.id,
        articleId: article.id
      },
      include: {
        author: {
          include: {
            followedBy: true
          }
        }
      }
    });

    res.status(201).json({
      comment: formatComment(newComment, req.user.id)
    });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ errors: { message: ['Authentication required'] } });
      return;
    }

    const { slug, id } = req.params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      res.status(422).json({ errors: { id: ['is invalid'] } });
      return;
    }

    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      res.status(404).json({ errors: { article: ['Article not found'] } });
      return;
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment || comment.articleId !== article.id) {
      res.status(404).json({ errors: { comment: ['Comment not found'] } });
      return;
    }

    if (comment.authorId !== req.user.id) {
      res.status(403).json({ errors: { authorization: ['You are not the author of this comment'] } });
      return;
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ errors: { server: ['Internal server error'] } });
  }
}

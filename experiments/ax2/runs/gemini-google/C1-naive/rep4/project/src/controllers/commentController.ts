import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

async function formatComment(comment: any, currentUserId?: number) {
  let following = false;
  if (currentUserId) {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: comment.author.id
        }
      }
    });
    following = !!follow;
  }

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following
    }
  };
}

export async function getComments(req: AuthRequest, res: Response) {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });

    const formattedComments = await Promise.all(
      comments.map((comment) => formatComment(comment, req.user?.id))
    );

    return res.status(200).json({ comments: formattedComments });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function addComment(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug } = req.params;
  const { comment } = req.body || {};

  if (!comment || !comment.body) {
    return res.status(422).json({ errors: { body: ["can't be blank"] } });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    const created = await prisma.comment.create({
      data: {
        body: comment.body,
        articleId: article.id,
        authorId: req.user.id
      },
      include: { author: true }
    });

    const formatted = await formatComment(created, req.user.id);
    return res.status(201).json({ comment: formatted });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ errors: { body: ['Unauthorized'] } });
  }

  const { slug, id } = req.params;
  const commentId = parseInt(id, 10);

  if (isNaN(commentId)) {
    return res.status(422).json({ errors: { body: ['Invalid comment ID'] } });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug }
    });

    if (!article) {
      return res.status(404).json({ errors: { body: ['Article not found'] } });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ errors: { body: ['Comment not found'] } });
    }

    if (existingComment.authorId !== req.user.id) {
      return res.status(403).json({ errors: { body: ['Forbidden'] } });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ errors: { body: ['Internal server error'] } });
  }
}

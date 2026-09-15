import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, CommentResponse } from '../types';

type RawComment = {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    followedBy?: { followerId: number }[];
  };
};

const formatComment = (comment: RawComment, currentUserId?: number): CommentResponse => {
  const following = currentUserId
    ? (comment.author.followedBy ? comment.author.followedBy.some((f) => f.followerId === currentUserId) : false)
    : false;

  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio || '',
      image: comment.author.image || '',
      following
    }
  };
};

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;

  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: {
      author: req.user
        ? {
            include: {
              followedBy: { where: { followerId: req.user.id } }
            }
          }
        : true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    comments: comments.map((c: any) => formatComment(c, req.user?.id))
  });
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug } = req.params;
  const { comment } = req.body || {};

  if (!comment || !comment.body || comment.body.trim() === '') {
    res.status(422).json({ errors: { body: ["can't be blank"] } });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  const newComment = await prisma.comment.create({
    data: {
      body: comment.body,
      articleId: article.id,
      authorId: req.user.id
    },
    include: {
      author: true
    }
  });

  res.status(201).json({
    comment: formatComment(newComment as any, req.user.id)
  });
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ errors: { authorization: ['Authentication required'] } });
    return;
  }

  const { slug, id } = req.params;
  const commentId = Number(id);

  if (isNaN(commentId)) {
    res.status(422).json({ errors: { id: ['is invalid'] } });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    res.status(404).json({ errors: { article: ['not found'] } });
    return;
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    res.status(404).json({ errors: { comment: ['not found'] } });
    return;
  }

  if (comment.authorId !== req.user.id) {
    res.status(403).json({ errors: { comment: ['Forbidden: You are not the author'] } });
    return;
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });

  res.status(200).json({});
};

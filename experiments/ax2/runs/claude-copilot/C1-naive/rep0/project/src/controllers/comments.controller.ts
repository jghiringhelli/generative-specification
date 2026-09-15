import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

interface CommentWithAuthor {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: number; username: string; bio: string | null; image: string | null };
}

async function isFollowing(currentUserId: number, authorId: number): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: currentUserId, followingId: authorId },
    },
  });
  return !!follow;
}

async function toCommentResponse(comment: CommentWithAuthor, currentUserId?: number) {
  const following = currentUserId
    ? await isFollowing(currentUserId, comment.author.id)
    : false;
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following,
    },
  };
}

export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  const rendered = await Promise.all(
    comments.map((c) => toCommentResponse(c as CommentWithAuthor, req.user?.id))
  );
  res.json({ comments: rendered });
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  const payload = req.body?.comment;
  if (!payload || !payload.body) {
    throw new HttpError(422, ["body can't be blank"]);
  }
  const comment = await prisma.comment.create({
    data: {
      body: payload.body,
      articleId: article.id,
      authorId: req.user!.id,
    },
    include: { author: true },
  });
  res.status(201).json({
    comment: await toCommentResponse(comment as CommentWithAuthor, req.user!.id),
  });
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const { slug, id } = req.params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw new HttpError(404, ['article not found']);
  }
  const commentId = parseInt(id, 10);
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.articleId !== article.id) {
    throw new HttpError(404, ['comment not found']);
  }
  if (comment.authorId !== req.user!.id) {
    throw new HttpError(403, ['forbidden']);
  }
  await prisma.comment.delete({ where: { id: commentId } });
  res.status(200).json({});
}

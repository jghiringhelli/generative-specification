import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

async function buildCommentView(commentId: number, currentUserId?: number) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { author: true },
  });
  if (!comment) return null;

  let following = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: comment.authorId,
        },
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
      bio: comment.author.bio,
      image: comment.author.image,
      following,
    },
  };
}

export async function getComments(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    orderBy: { createdAt: 'desc' },
  });
  const views = await Promise.all(
    comments.map((c) => buildCommentView(c.id, req.user?.id))
  );
  return res.json({ comments: views });
}

export async function addComment(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
  if (!article) {
    return res.status(404).json({ errors: { body: ['article not found'] } });
  }
  const body = req.body.comment;
  if (!body || !body.body) {
    return res.status(422).json({ errors: { body: ['comment body is required'] } });
  }
  const comment = await prisma.comment.create({
    data: {
      body: body.body,
      authorId: req.user!.id,
      articleId: article.id,
    },
  });
  const view = await buildCommentView(comment.id, req.user!.id);
  return res.status(201).json({ comment: view });
}

export async function deleteComment(req: AuthRequest, res: Response) {
  const article = await prisma.article.findUnique({
    where: { slug: req.params.slug },
  });
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
}

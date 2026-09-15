import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, optionalAuth, requireAuth } from '../middleware/auth';
import { formatProfile } from '../utils/responses';

export const commentsRouter = Router();

const commentInclude = {
  author: { include: { followers: true } },
} as const;

function formatComment(
  comment: Awaited<ReturnType<typeof findComment>>,
  currentUserId?: number,
) {
  if (!comment) return null;
  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author: formatProfile(
      comment.author,
      currentUserId
        ? comment.author.followers.some((follow) => follow.followerId === currentUserId)
        : false,
    ),
  };
}

async function findComment(id: number) {
  return prisma.comment.findUnique({ where: { id }, include: commentInclude });
}

commentsRouter.get('/articles/:slug/comments', optionalAuth, async (request: AuthenticatedRequest, response) => {
  const article = await prisma.article.findUnique({ where: { slug: request.params.slug } });
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  });
  response.json({ comments: comments.map((comment) => formatComment(comment, request.userId)) });
});

commentsRouter.post('/articles/:slug/comments', requireAuth, async (request: AuthenticatedRequest, response) => {
  const article = await prisma.article.findUnique({ where: { slug: request.params.slug } });
  if (!article) {
    response.status(404).json({ errors: { body: ['Article not found'] } });
    return;
  }
  const body = request.body.comment?.body;
  if (!body) {
    response.status(422).json({ errors: { body: ['comment body is required'] } });
    return;
  }

  const comment = await prisma.comment.create({
    data: { body, articleId: article.id, authorId: request.userId! },
    include: commentInclude,
  });
  response.status(201).json({ comment: formatComment(comment, request.userId) });
});

commentsRouter.delete('/articles/:slug/comments/:id', requireAuth, async (request: AuthenticatedRequest, response) => {
  const commentId = Number.parseInt(request.params.id, 10);
  if (Number.isNaN(commentId)) {
    response.status(404).json({ errors: { body: ['Comment not found'] } });
    return;
  }

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      authorId: request.userId,
      article: { slug: request.params.slug },
    },
  });
  if (!comment) {
    response.status(404).json({ errors: { body: ['Comment not found'] } });
    return;
  }
  await prisma.comment.delete({ where: { id: comment.id } });
  response.status(204).send();
});

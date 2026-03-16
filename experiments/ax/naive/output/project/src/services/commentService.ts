import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

async function getProfile(userId: number, currentUserId?: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      followers: currentUserId ? {
        where: { followerId: currentUserId }
      } : false
    }
  });

  return {
    username: user!.username,
    bio: user!.bio,
    image: user!.image,
    following: currentUserId ? (user!.followers as any[]).length > 0 : false
  };
}

async function formatComment(comment: any, currentUserId?: number) {
  const author = await getProfile(comment.authorId, currentUserId);

  return {
    id: comment.id,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    body: comment.body,
    author
  };
}

export async function addComment(slug: string, userId: number, body: string) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comment = await prisma.comment.create({
    data: {
      body,
      authorId: userId,
      articleId: article.id
    }
  });

  return formatComment(comment, userId);
}

export async function getComments(slug: string, currentUserId?: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comments = await prisma.comment.findMany({
    where: { articleId: article.id },
    orderBy: { createdAt: 'desc' }
  });

  const formattedComments = await Promise.all(
    comments.map(comment => formatComment(comment, currentUserId))
  );

  return formattedComments;
}

export async function deleteComment(slug: string, commentId: number, userId: number) {
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    throw new NotFoundError('Article not found');
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.articleId !== article.id) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId }
  });
}

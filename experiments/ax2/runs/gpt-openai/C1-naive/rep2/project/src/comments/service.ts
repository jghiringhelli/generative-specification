import { Prisma } from "@prisma/client";
import { prisma } from "../database";
import { NotFoundError, UnauthorizedError, ValidationError } from "../errors";

const commentInclude = { author: true } satisfies Prisma.CommentInclude;
type CommentWithAuthor = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

export interface CommentResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

async function getArticleId(slug: string): Promise<number> {
  const article = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
  if (!article) throw new NotFoundError("Article not found");
  return article.id;
}

async function isFollowing(viewerId: number | undefined, authorId: number): Promise<boolean> {
  if (!viewerId) return false;
  return Boolean(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: authorId } },
  }));
}

async function toCommentResponse(
  comment: CommentWithAuthor,
  viewerId?: number,
): Promise<CommentResponse> {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: await isFollowing(viewerId, comment.authorId),
    },
  };
}

/** Lists all comments on an article. */
export async function listComments(slug: string, viewerId?: number): Promise<CommentResponse[]> {
  const articleId = await getArticleId(slug);
  const comments = await prisma.comment.findMany({
    where: { articleId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(comments.map((comment) => toCommentResponse(comment, viewerId)));
}

/** Adds a comment to an article. */
export async function addComment(
  slug: string,
  body: string | undefined,
  authorId: number,
): Promise<CommentResponse> {
  if (!body?.trim()) throw new ValidationError({ body: ["can't be blank"] });
  const articleId = await getArticleId(slug);
  const comment = await prisma.comment.create({
    data: { body, authorId, articleId },
    include: commentInclude,
  });
  return toCommentResponse(comment, authorId);
}

/** Deletes a comment owned by the current user. */
export async function deleteComment(slug: string, commentId: number, userId: number): Promise<void> {
  const articleId = await getArticleId(slug);
  const comment = await prisma.comment.findFirst({ where: { id: commentId, articleId } });
  if (!comment) throw new NotFoundError("Comment not found");
  if (comment.authorId !== userId) throw new UnauthorizedError("Only the author may delete this comment");
  await prisma.comment.delete({ where: { id: comment.id } });
}

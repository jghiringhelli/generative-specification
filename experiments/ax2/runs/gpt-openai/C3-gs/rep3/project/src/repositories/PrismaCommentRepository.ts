import { Prisma, PrismaClient } from '@prisma/client';
import {
  CommentRecord,
  ICommentRepository,
} from './ICommentRepository';

const commentInclude = {
  author: {
    include: { followers: { select: { followerId: true } } },
  },
} satisfies Prisma.CommentInclude;

type LoadedComment = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

function toRecord(comment: LoadedComment): CommentRecord {
  return {
    id: comment.id,
    body: comment.body,
    articleId: comment.articleId,
    authorId: comment.authorId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      followerIds: comment.author.followers.map((follow) => follow.followerId),
    },
  };
}

export class PrismaCommentRepository implements ICommentRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async findById(id: string): Promise<CommentRecord | null> {
    const comment = await this.client.comment.findUnique({
      where: { id },
      include: commentInclude,
    });
    return comment ? toRecord(comment) : null;
  }

  public async listByArticle(
    articleId: string,
  ): Promise<ReadonlyArray<CommentRecord>> {
    const comments = await this.client.comment.findMany({
      where: { articleId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return comments.map(toRecord);
  }

  public async create(
    articleId: string,
    authorId: string,
    body: string,
  ): Promise<CommentRecord> {
    const comment = await this.client.comment.create({
      data: { articleId, authorId, body },
      include: commentInclude,
    });
    return toRecord(comment);
  }

  public async delete(id: string): Promise<void> {
    await this.client.comment.delete({ where: { id } });
  }
}

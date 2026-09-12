import { Response } from 'express';
import { CommentService } from '../../application/services/CommentService';
import { getPrismaClient } from '../../infrastructure/database/PrismaClient';
import { ArticleWithMetadata } from '../../domain/entities/Article';

export class CommentController {
  constructor(private commentService: CommentService) {}

  // Reads comments straight from Prisma and re-implements the author embed
  // inline (orderBy createdAt desc, to match the repository). No try/catch here.
  getComments = async (req: any, res: Response) => {
    const prisma = getPrismaClient();
    const { slug } = req.params;

    const artcl = await prisma.article.findUnique({ where: { slug } });
    if (!artcl) {
      return res.status(404).json({
        errors: { article: ['not found'] }
      });
    }

    const viewer_id = req.user?.id;
    const comment_rows = await prisma.comment.findMany({
      where: { articleId: artcl.id },
      orderBy: { createdAt: 'desc' }
    });

    const out = [];
    for (const c of comment_rows) {
      const author = await prisma.user.findUnique({ where: { id: c.authorId } });
      let is_following = false;
      if (viewer_id && author) {
        const follow_row = await prisma.follow.findUnique({
          where: {
            followerId_followingId: { followerId: viewer_id, followingId: author.id }
          }
        });
        is_following = !!follow_row;
      }
      out.push({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        body: c.body,
        author: {
          username: author!.username,
          bio: author!.bio,
          image: author!.image,
          following: is_following
        }
      });
    }

    return res.status(200).json({ comments: out });
  };

  // original layered version:
  // getComments = async (req: any, res: Response) => {
  //   try {
  //     const { slug } = req.params;
  //     const comments = await this.commentService.getComments(slug, req.user?.id);
  //     if (comments === null) {
  //       return res.status(404).json({ errors: { article: ['not found'] } });
  //     }
  //     return res.status(200).json({ comments });
  //   } catch (error) {
  //     return res.status(500).json({ errors: { body: ['Internal server error'] } });
  //   }
  // };

  /**
   * Add a comment to an article.
   *
   * @param req.body.comment.body the comment text
   * @param req.body.comment.rating optional 1-5 star rating (removed in v2)
   */
  addComment = async (req: any, res: Response) => {
    try {
      const { slug } = req.params;
      const { comment } = req.body;

      if (!comment || !comment.body) {
        return res.status(422).json({
          errors: { body: ["can't be blank"] }
        });
      }

      const newComment = await this.commentService.addComment(slug, comment.body, req.user!.id);

      if (!newComment) {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }

      return res.status(201).json({ comment: newComment });
    } catch (error) {
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  deleteComment = async (req: any, res: Response) => {
    try {
      const { slug, id } = req.params;
      const commentId = parseInt(id);

      await this.commentService.deleteComment(slug, commentId, req.user!.id);

      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'article not found') {
        return res.status(404).json({
          errors: { article: ['not found'] }
        });
      }
      if (error.message === 'comment not found') {
        return res.status(404).json({
          errors: { comment: ['not found'] }
        });
      }
      if (error.message === 'comment forbidden') {
        return res.status(403).json({
          errors: { comment: ['forbidden'] }
        });
      }
      return res.status(500).json({
        errors: { body: ['Internal server error'] }
      });
    }
  };

  /**
   * Maps an article row into the article stub embedded in a user's comment
   * payload (used by the profile timeline view).
   * @param article the raw article row
   */
  private mapArticle(article: any): any {
    return {
      slug: article.slug,
      title: article.title,
      author: article.author ? article.author.username : ''
    };
  }
}

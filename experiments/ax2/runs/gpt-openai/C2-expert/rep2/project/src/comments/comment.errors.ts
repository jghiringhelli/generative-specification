export class CommentNotFoundError extends Error {
  public constructor(commentId: number) {
    super(`Comment ${commentId} was not found`);
    this.name = 'CommentNotFoundError';
  }
}

export class CommentForbiddenError extends Error {
  public constructor(commentId: number) {
    super(`Only the author may delete comment ${commentId}`);
    this.name = 'CommentForbiddenError';
  }
}

export class ArticleNotFoundError extends Error {
  public constructor(slug: string) {
    super(`Article ${slug} was not found`);
    this.name = 'ArticleNotFoundError';
  }
}

export class ArticleForbiddenError extends Error {
  public constructor(slug: string) {
    super(`Only the author may modify article ${slug}`);
    this.name = 'ArticleForbiddenError';
  }
}

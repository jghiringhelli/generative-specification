import {
  DEFAULT_ARTICLE_LIMIT,
  DEFAULT_ARTICLE_OFFSET,
  articleUpdateSchema,
  listArticlesSchema,
} from '../schemas';

describe('article schemas', () => {
  it('applies the documented pagination defaults', () => {
    const result = listArticlesSchema.parse({});
    expect(result.limit).toBe(DEFAULT_ARTICLE_LIMIT);
    expect(result.offset).toBe(DEFAULT_ARTICLE_OFFSET);
  });

  it('coerces non-negative integer pagination query strings', () => {
    const result = listArticlesSchema.parse({ limit: '5', offset: '10' });
    expect(result).toMatchObject({ limit: 5, offset: 10 });
  });

  it('rejects negative and fractional pagination values', () => {
    expect(listArticlesSchema.safeParse({ limit: '-1' }).success).toBe(false);
    expect(listArticlesSchema.safeParse({ offset: '1.5' }).success).toBe(false);
  });

  it('accepts tag lists when updating an article', () => {
    const result = articleUpdateSchema.parse({ article: { tagList: ['api'] } });
    expect(result.article.tagList).toEqual(['api']);
  });
});

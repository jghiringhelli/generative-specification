import { articleListSchema } from '../../src/articles/article.schemas';

describe('article list validation', () => {
  test('uses default pagination when limit and offset are omitted', () => {
    expect(articleListSchema.parse({})).toMatchObject({ limit: 20, offset: 0 });
  });

  test('coerces non-negative integer pagination values from query strings', () => {
    expect(articleListSchema.parse({ limit: '5', offset: '10' })).toMatchObject({ limit: 5, offset: 10 });
  });

  test.each([{ limit: '-1' }, { offset: '-1' }, { limit: '1.5' }])(
    'rejects invalid pagination values: %p',
    (query) => expect(() => articleListSchema.parse(query)).toThrow(),
  );
});

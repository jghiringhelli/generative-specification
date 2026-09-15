import { articlesQuerySchema, feedQuerySchema } from '../../src/modules/articles/article.dto';

describe('Pagination and Query Validation Unit Tests', () => {
  describe('articlesQuerySchema defaults and coercion', () => {
    it('applies default limit of 20 and offset of 0 when query params are omitted', () => {
      const parsed = articlesQuerySchema.parse({});

      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(0);
    });

    it('coerces string limit and offset to numbers correctly', () => {
      const parsed = articlesQuerySchema.parse({
        limit: '15',
        offset: '30'
      });

      expect(parsed.limit).toBe(15);
      expect(parsed.offset).toBe(30);
    });

    it('rejects negative limit values with validation error', () => {
      expect(() => {
        articlesQuerySchema.parse({ limit: '-5' });
      }).toThrow();
    });

    it('rejects negative offset values with validation error', () => {
      expect(() => {
        articlesQuerySchema.parse({ offset: '-1' });
      }).toThrow();
    });

    it('rejects non-integer limit values', () => {
      expect(() => {
        articlesQuerySchema.parse({ limit: '3.14' });
      }).toThrow();
    });
  });

  describe('feedQuerySchema defaults and coercion', () => {
    it('applies default limit of 20 and offset of 0 for feed query', () => {
      const parsed = feedQuerySchema.parse({});

      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(0);
    });

    it('coerces valid feed query strings to integers', () => {
      const parsed = feedQuerySchema.parse({
        limit: '10',
        offset: '20'
      });

      expect(parsed.limit).toBe(10);
      expect(parsed.offset).toBe(20);
    });
  });
});

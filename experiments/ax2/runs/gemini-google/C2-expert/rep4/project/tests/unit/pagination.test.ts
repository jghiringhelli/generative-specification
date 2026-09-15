import { PaginationQuerySchema } from '../../src/services/article-service';

describe('Pagination Query Schema', () => {
  it('applies default limit of 20 and offset of 0 when parameters are omitted', () => {
    const parsed = PaginationQuerySchema.parse({});

    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('coerces valid string integers to numeric values', () => {
    const parsed = PaginationQuerySchema.parse({
      limit: '15',
      offset: '30',
      tag: 'typescript',
    });

    expect(parsed.limit).toBe(15);
    expect(parsed.offset).toBe(30);
    expect(parsed.tag).toBe('typescript');
  });

  it('rejects negative limit values with a validation error', () => {
    expect(() => {
      PaginationQuerySchema.parse({ limit: '-5' });
    }).toThrow();
  });

  it('rejects negative offset values with a validation error', () => {
    expect(() => {
      PaginationQuerySchema.parse({ offset: '-1' });
    }).toThrow();
  });
});

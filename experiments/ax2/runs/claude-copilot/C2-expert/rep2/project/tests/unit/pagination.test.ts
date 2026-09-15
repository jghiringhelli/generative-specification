import { resolvePagination } from '../../src/utils/pagination';

describe('resolvePagination', () => {
  it('applies default limit of twenty and offset of zero when omitted', () => {
    expect(resolvePagination(undefined, undefined)).toEqual({ limit: 20, offset: 0 });
  });

  it('parses provided numeric strings into integers', () => {
    expect(resolvePagination('5', '10')).toEqual({ limit: 5, offset: 10 });
  });

  it('throws when limit is negative', () => {
    expect(() => resolvePagination('-1', '0')).toThrow('limit must be a non-negative integer');
  });

  it('throws when offset is not an integer', () => {
    expect(() => resolvePagination('20', '1.5')).toThrow('offset must be a non-negative integer');
  });
});

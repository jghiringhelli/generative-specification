import {
  resolvePagination,
  PaginationError,
} from '../../src/utils/pagination';

describe('pagination resolution', () => {
  it('applies default limit of 20 and offset of 0 when values are absent', () => {
    const pagination = resolvePagination(undefined, undefined);
    expect(pagination.limit).toBe(20);
    expect(pagination.offset).toBe(0);
  });

  it('parses valid numeric strings into integers', () => {
    const pagination = resolvePagination('5', '10');
    expect(pagination.limit).toBe(5);
    expect(pagination.offset).toBe(10);
  });

  it('throws when limit is negative', () => {
    expect(() => resolvePagination('-1', '0')).toThrow(PaginationError);
  });

  it('throws when offset is not an integer', () => {
    expect(() => resolvePagination('20', 'abc')).toThrow(PaginationError);
  });

  it('accepts zero as a valid limit and offset', () => {
    const pagination = resolvePagination('0', '0');
    expect(pagination.limit).toBe(0);
    expect(pagination.offset).toBe(0);
  });
});

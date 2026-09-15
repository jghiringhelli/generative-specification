import { parsePagination } from '../../src/utils/pagination.util';
import { ValidationError } from '../../src/utils/error.util';
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from '../../src/config/constants';

describe('Pagination utility', () => {
  it('returns default limit 20 and offset 0 when undefined', () => {
    const result = parsePagination(undefined, undefined);

    expect(result.limit).toBe(DEFAULT_PAGE_LIMIT);
    expect(result.offset).toBe(DEFAULT_PAGE_OFFSET);
  });

  it('parses valid positive integer strings', () => {
    const result = parsePagination('10', '30');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(30);
  });

  it('throws ValidationError when limit is negative', () => {
    expect(() => parsePagination('-5', '0')).toThrow(ValidationError);
    expect(() => parsePagination('-5', '0')).toThrow('Limit must be a non-negative integer');
  });

  it('throws ValidationError when offset is negative', () => {
    expect(() => parsePagination('20', '-1')).toThrow(ValidationError);
    expect(() => parsePagination('20', '-1')).toThrow('Offset must be a non-negative integer');
  });

  it('throws ValidationError when limit is not an integer', () => {
    expect(() => parsePagination('invalid', '0')).toThrow(ValidationError);
    expect(() => parsePagination('3.14', '0')).toThrow(ValidationError);
  });
});

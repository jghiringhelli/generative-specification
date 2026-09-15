import { parsePagination } from '../../src/utils/pagination';
import { ValidationError } from '../../src/errors';

describe('pagination parsing', () => {
  it('applies default limit 20 and offset 0 when values are absent', () => {
    expect(parsePagination(undefined, undefined)).toEqual({
      limit: 20,
      offset: 0
    });
  });

  it('parses numeric string values into integers', () => {
    expect(parsePagination('5', '10')).toEqual({ limit: 5, offset: 10 });
  });

  it('throws a validation error when limit is negative', () => {
    expect(() => parsePagination('-1', '0')).toThrow(ValidationError);
  });

  it('throws a validation error when offset is not an integer', () => {
    expect(() => parsePagination('20', 'abc')).toThrow(ValidationError);
  });

  it('treats an empty string as an absent value and uses the default', () => {
    expect(parsePagination('', '')).toEqual({ limit: 20, offset: 0 });
  });
});

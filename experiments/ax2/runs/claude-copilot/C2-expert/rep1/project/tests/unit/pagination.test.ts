import { parsePagination } from '../../src/lib/pagination';
import { ValidationError } from '../../src/lib/errors';

describe('parsePagination', () => {
  it('applies default limit of 20 and offset of 0 when absent', () => {
    const result = parsePagination(undefined, undefined);
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it('parses valid numeric strings into integers', () => {
    const result = parsePagination('5', '10');
    expect(result).toEqual({ limit: 5, offset: 10 });
  });

  it('throws a validation error when limit is negative', () => {
    expect(() => parsePagination('-1', '0')).toThrow(ValidationError);
  });

  it('throws a validation error when offset is not an integer', () => {
    expect(() => parsePagination('20', '1.5')).toThrow(ValidationError);
  });

  it('treats an empty string as the default value', () => {
    const result = parsePagination('', '');
    expect(result).toEqual({ limit: 20, offset: 0 });
  });
});

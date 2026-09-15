import { parsePagination } from '../../src/lib/pagination';
import { ValidationError } from '../../src/lib/errors';

describe('Pagination Utility', () => {
  it('applies default limit 20 and offset 0 when parameters are omitted', () => {
    const result = parsePagination(undefined, undefined);
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it('correctly parses valid positive integer values for limit and offset', () => {
    const result = parsePagination('15', '30');
    expect(result).toEqual({ limit: 15, offset: 30 });
  });

  it('throws ValidationError when limit is a negative integer', () => {
    expect(() => {
      parsePagination('-1', '0');
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when offset is a negative integer', () => {
    expect(() => {
      parsePagination('10', '-5');
    }).toThrow(ValidationError);
  });

  it('throws ValidationError when pagination parameter is non-numeric or float', () => {
    expect(() => {
      parsePagination('abc', '0');
    }).toThrow(ValidationError);

    expect(() => {
      parsePagination('10.5', '0');
    }).toThrow(ValidationError);
  });
});

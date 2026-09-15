import { z } from 'zod';
import { parseOrThrow } from '../../src/utils/validation';
import { ValidationError } from '../../src/errors/AppError';

const schema = z.object({
  name: z.string().min(1, "can't be blank"),
  age: z.number().int()
});

describe('parseOrThrow', () => {
  it('returns the parsed value on success', () => {
    const result = parseOrThrow(schema, { name: 'Jane', age: 30 });
    expect(result).toEqual({ name: 'Jane', age: 30 });
  });

  it('throws ValidationError with field-keyed messages on failure', () => {
    try {
      parseOrThrow(schema, { name: '', age: 'nope' });
      fail('expected ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const fields = (error as ValidationError).fields;
      expect(fields.name).toEqual(["can't be blank"]);
      expect(fields.age).toEqual(expect.any(Array));
    }
  });
});

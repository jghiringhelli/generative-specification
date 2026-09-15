import { parseOrThrow, registerSchema } from '../../src/validation/schemas';
import { ValidationError } from '../../src/errors/AppError';

describe('parseOrThrow', () => {
  it('returns the parsed value for valid input', () => {
    const value = parseOrThrow(registerSchema, {
      user: { username: 'a', email: 'a@example.com', password: 'pw' },
    });
    expect(value.user.username).toBe('a');
  });

  it('throws a ValidationError with field keys for invalid input', () => {
    expect.assertions(2);
    try {
      parseOrThrow(registerSchema, { user: { username: '', email: 'bad', password: '' } });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validation = error as ValidationError;
      expect(Object.keys(validation.fields).length).toBeGreaterThan(0);
    }
  });
});

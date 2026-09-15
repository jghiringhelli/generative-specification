import {
  HttpError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../src/utils/errors';

describe('domain error formatting', () => {
  it('exposes the status and messages on the base HttpError', () => {
    const error = new HttpError(400, ['bad request']);
    expect(error.status).toBe(400);
    expect(error.messages).toEqual(['bad request']);
  });

  it('defaults UnauthorizedError to status 401', () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  it('defaults ForbiddenError to status 403', () => {
    expect(new ForbiddenError().status).toBe(403);
  });

  it('defaults NotFoundError to status 404', () => {
    expect(new NotFoundError().status).toBe(404);
  });

  it('sets ValidationError to status 422 with the provided messages', () => {
    const error = new ValidationError(['email is required']);
    expect(error.status).toBe(422);
    expect(error.messages).toEqual(['email is required']);
  });
});
